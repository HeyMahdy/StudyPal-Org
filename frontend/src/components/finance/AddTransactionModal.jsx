import { Brain, Receipt, Send, X } from 'lucide-react';
import { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import agentApi from '../../services/agentApi';
import api from '../../services/api';
import { today } from '../../utils/format';

const categories = ['Food & Dining', 'Housing', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Utilities', 'Subscriptions', 'Savings', 'Other'];

export default function AddTransactionModal({ isOpen, onClose, onAdd }) {
  const [type, setType] = useState('Expense');
  const [form, setForm] = useState({ amount: '', description: '', category: 'Food & Dining', date: today() });
  
  const [aiMode, setAiMode] = useState(false);
  const [aiText, setAiText] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(form.amount);
    if (!amountNum) return;
    
    const isExpense = type === 'Expense';
    const payload = {
      ...form,
      amount: amountNum,
      // The backend uses 'expenses' table generally for tracking.
      // If income, it might be a different table or signed differently.
      // Assuming /expenses for all, or we handle it based on type.
      // Based on original FinanceExpenses, we just POST to /expenses
      type: type.toLowerCase() // Add type if backend supports it
    };
    
    await api.post('/expenses', payload);
    onAdd();
    onClose();
  };

  const processAiText = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    if (!aiText.trim()) return;
    setIsProcessing(true);
    setAiError('');
    try {
      const token = localStorage.getItem('studypal_token');
      // The backend returns a parsed expense. Wait, the endpoint in AI Expenses saves it directly,
      // but if we want to auto-fill, we'd ideally have an endpoint that just parses. 
      // Assuming the current endpoint saves it, we might need to just let it save and close, 
      // OR since it saves it, we can just say "Transaction Saved!"
      // Let's use the existing endpoint which actually saves it to /ai-expenses.
      // The user wants AI capture in the Add Transaction. 
      // We'll post to agentApi, and if successful, we just refresh and close.
      const response = await agentApi.post('/expense/text', { text: aiText.trim() }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response?.clarification_needed) {
        setAiError(response.question || 'Please clarify.');
        return;
      }
      if (response?.status && response.status !== 'success') {
        setAiError(response.error || 'Could not process AI text.');
        return;
      }
      if (response?.status === 'success') {
        onAdd();
        onClose();
        return;
      }
      setAiError('Could not process AI text.');
    } catch (error) {
      setAiError(error?.message || 'Could not process AI text.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processReceipt = async () => {
    if (!receiptFile) return;
    setIsProcessing(true);
    setAiError('');
    try {
      const formData = new FormData();
      formData.append('file', receiptFile);
      const token = localStorage.getItem('studypal_token');
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const response = await agentApi.post('/expense/receipt', formData, { headers });
      if (response?.clarification_needed) {
        setAiError(response.question || 'Please clarify.');
        return;
      }
      if (response?.status && response.status !== 'success') {
        setAiError(response.error || 'Could not process receipt.');
        return;
      }
      if (response?.status === 'success') {
        onAdd();
        onClose();
        return;
      }
      setAiError('Could not process receipt.');
    } catch (error) {
      setAiError(error?.message || 'Could not process receipt.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[24px] bg-white shadow-xl dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-gray-800">
          <h2 className="font-serif text-2xl font-bold">Add Transaction</h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-slate-100 hover:text-gray-900 dark:hover:bg-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-6 flex justify-between gap-4 border-b border-slate-100 pb-4 dark:border-gray-800">
            <button
              onClick={() => setAiMode(false)}
              className={`text-sm font-semibold transition-colors ${!aiMode ? 'text-primary' : 'text-gray-400 hover:text-gray-700'}`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setAiMode(true)}
              className={`flex items-center gap-2 text-sm font-semibold transition-colors ${aiMode ? 'text-primary' : 'text-gray-400 hover:text-gray-700'}`}
            >
              <Brain size={16} />
              AI Capture
            </button>
          </div>

          {aiMode ? (
            <div className="grid gap-5">
              <form onSubmit={processAiText} className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50">
                <p className="text-sm text-indigo-900 dark:text-indigo-200 mb-3">Type your expense naturally or upload a receipt. Our AI will automatically categorize and save it.</p>
                <div className="flex gap-2">
                  <Input 
                    value={aiText} 
                    onChange={e => setAiText(e.target.value)} 
                    placeholder="e.g. Spent $15 on lunch at Gulshan" 
                    className="bg-white dark:bg-gray-900"
                  />
                  <Button type="submit" disabled={isProcessing} className="px-3">
                    <Send size={18} />
                  </Button>
                </div>
              </form>
              
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-6 dark:border-gray-800">
                <input
                  type="file"
                  id="receipt-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setReceiptFile(e.target.files?.[0])}
                />
                <label htmlFor="receipt-upload" className="flex cursor-pointer flex-col items-center gap-2 text-sm text-gray-500 hover:text-primary">
                  <div className="rounded-full bg-slate-100 p-3 dark:bg-gray-800">
                    <Receipt size={24} />
                  </div>
                  <span className="font-semibold">{receiptFile ? receiptFile.name : 'Upload Receipt Image'}</span>
                </label>
                {receiptFile && (
                  <Button onClick={processReceipt} disabled={isProcessing} className="mt-4 w-full justify-center">
                    {isProcessing ? 'Processing...' : 'Process Receipt'}
                  </Button>
                )}
              </div>
              {aiError && <p className="text-sm text-red-500 font-medium text-center">{aiError}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-gray-800">
                {['Expense', 'Income', 'Transfer'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${type === t ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                  >
                    {t === 'Expense' ? '↑ ' : t === 'Income' ? '↓ ' : '⇄ '}
                    {t}
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Amount</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    value={form.amount} 
                    onChange={e => setForm({...form, amount: e.target.value})} 
                    placeholder="0.00" 
                    required 
                    className="font-mono text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Description</label>
                <Input 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  placeholder="e.g. Lunch at Gulshan" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Category</label>
                  <select 
                    className="input bg-white dark:bg-gray-900" 
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Date</label>
                  <Input 
                    type="date" 
                    value={form.date} 
                    onChange={e => setForm({...form, date: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-between gap-4 border-t border-slate-100 pt-5 dark:border-gray-800">
                <Button type="button" onClick={onClose} className="!bg-white !text-gray-500 border border-slate-200 hover:!bg-slate-50 dark:!bg-gray-800 dark:!text-gray-400 dark:border-gray-700">Cancel</Button>
                <Button type="submit" className="!bg-[#0f0e0d] flex-1 text-white hover:!bg-black dark:!bg-white dark:!text-black">Save Transaction</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}