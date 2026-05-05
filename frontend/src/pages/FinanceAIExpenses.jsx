import { ArrowLeft, Receipt, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';
import agentApi from '../services/agentApi';

const money = (value) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function FinanceAIExpenses() {
  const [textInput, setTextInput] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [isTextLoading, setIsTextLoading] = useState(false);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);
  const [agentError, setAgentError] = useState('');
  const [clarification, setClarification] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const load = () => {
    api.get('/ai-expenses').then((res) => {
      console.log('ai-expenses list response', res);
      setExpenses(res.data.expenses || []);
    });
    api.get('/ai-expenses/summary').then((res) => {
      console.log('ai-expenses summary response', res);
      setSummary(res.data.summary || []);
    });
  };

  useEffect(() => { load(); }, []);

  const submitText = async (event) => {
    event.preventDefault();
    if (!textInput.trim()) return;
    setIsTextLoading(true);
    setAgentError('');
    setClarification('');

    try {
      const token = localStorage.getItem('studypal_token');
      const response = await agentApi.post('/expense/text', { text: textInput.trim() }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      console.log('agent text response', response);
      if (response?.clarification_needed) {
        setClarification(response.question || 'Please clarify the expense.');
        return;
      }
      setTextInput('');
      load();
    } catch (error) {
      console.log('agent text error', error);
      setAgentError(error.message || 'Could not process the text expense.');
    } finally {
      setIsTextLoading(false);
    }
  };

  const submitReceipt = async (event) => {
    event.preventDefault();
    if (!receiptFile) return;
    setIsReceiptLoading(true);
    setAgentError('');
    setClarification('');

    try {
      const formData = new FormData();
      formData.append('file', receiptFile);
      const token = localStorage.getItem('studypal_token');
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await agentApi.post('/expense/receipt', formData, { headers });
      console.log('agent receipt response', response);
      if (response?.clarification_needed) {
        setClarification(response.question || 'Please clarify the expense.');
        return;
      }
      setReceiptFile(null);
      load();
    } catch (error) {
      console.log('agent receipt error', error);
      setAgentError(error.message || 'Could not process the receipt.');
    } finally {
      setIsReceiptLoading(false);
    }
  };

  const remove = async (id) => {
    const previous = expenses;
    setExpenses((current) => current.filter((item) => item.id !== id));
    try {
      await api.delete(`/ai-expenses/${id}`);
      load();
    } catch (error) {
      setExpenses(previous);
      setAgentError(error.message || 'Could not delete expense.');
    }
  };

  return (
    <div className="grid gap-6">
      <Link to="/finance" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary">
        <ArrowLeft size={16} />
        Back to Finance
      </Link>

      <div>
        <h1 className="text-3xl font-bold">AI Expense Capture</h1>
        <p className="text-gray-500 dark:text-gray-400">Send a text line or scan a receipt to auto-categorize expenses.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="grid gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Quick Text</p>
            <h2 className="text-xl font-bold">Type a single-line expense</h2>
          </div>
          <form onSubmit={submitText} className="grid gap-3">
            <Input
              label="Expense text"
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              placeholder="spent 150tk on photocopy at library"
            />
            <Button className="justify-center gap-2" disabled={isTextLoading}>
              <Send size={16} />
              {isTextLoading ? 'Processing...' : 'Send to Agent'}
            </Button>
          </form>
        </Card>

        <Card className="grid gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">Receipt Scan</p>
            <h2 className="text-xl font-bold">Upload a receipt image</h2>
          </div>
          <form onSubmit={submitReceipt} className="grid gap-3">
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
            />
            <Button className="justify-center gap-2" disabled={isReceiptLoading || !receiptFile}>
              <Receipt size={16} />
              {isReceiptLoading ? 'Processing...' : 'Upload Receipt'}
            </Button>
          </form>
        </Card>
      </div>

      {clarification && (
        <Card className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <p className="text-sm font-semibold">Clarification needed</p>
          <p className="text-lg font-semibold">{clarification}</p>
        </Card>
      )}

      {agentError && (
        <Card className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {agentError}
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {summary.map((item) => (
          <Card key={item.category}>
            <p className="text-sm text-gray-500">{item.category}</p>
            <p className="mt-2 text-2xl font-bold">{money(item.total)}</p>
            <p className="text-sm text-gray-500">{item.count} expenses • {item.percentage}%</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="grid gap-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 dark:border-gray-800">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{money(expense.amount)}</p>
                <p className="text-sm text-gray-500">{expense.item} • {expense.category}</p>
                <p className="text-xs text-gray-500">{expense.expense_date} • {expense.vendor || 'Unknown vendor'} • {expense.location || 'Unknown location'}</p>
              </div>
              <div className="flex items-center gap-2">
                {expense.is_academic ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">Academic</span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-gray-900 dark:text-gray-200">Personal</span>
                )}
                {expense.is_exam_week ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-200">Exam week</span>
                ) : null}
                <button onClick={() => remove(expense.id)} className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {!expenses.length && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-gray-500 dark:border-gray-800">
              No AI expenses yet.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
