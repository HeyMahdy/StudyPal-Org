import { ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';
import { today } from '../utils/format';

const categories = ['Food', 'Rent', 'Transport', 'Entertainment', 'Books', 'Health', 'Other'];
const money = (value) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(value || 0));
const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function FinanceExpenses() {
  const [month, setMonth] = useState(currentMonth());
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [data, setData] = useState({ expenses: [], overview: {} });
  const [form, setForm] = useState({ amount: '', category: 'Food', description: '', date: today() });

  const query = new URLSearchParams(Object.entries({ month, category, date }).filter(([, value]) => value)).toString();
  const load = () => api.get(`/expenses?${query}`).then((res) => setData(res.data));
  useEffect(() => { load(); }, [query]);

  const add = async (event) => {
    event.preventDefault();
    const temp = { ...form, id: `temp-${Date.now()}`, amount: Number(form.amount) };
    setData((current) => ({ ...current, expenses: [temp, ...current.expenses] }));
    setForm({ amount: '', category: 'Food', description: '', date: today() });
    await api.post('/expenses', form);
    load();
  };

  const remove = async (id) => {
    const previous = data;
    setData((current) => ({ ...current, expenses: current.expenses.filter((item) => item.id !== id) }));
    try { await api.delete(`/expenses/${id}`); load(); } catch { setData(previous); }
  };

  return (
    <div className="grid gap-6">
      <Link to="/finance" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary">
        <ArrowLeft size={16} />
        Back to Finance
      </Link>
      <div><h1 className="text-3xl font-bold">Expense Tracking</h1><p className="text-gray-500 dark:text-gray-400">Add spending fast and keep history easy to scan.</p></div>
      <div className="grid gap-5 md:grid-cols-4">
        <Metric label="Total Spent Today" value={money(data.overview.total_today)} tone="text-red-600 dark:text-red-300" />
        <Metric label="Total Spent This Month" value={money(data.overview.total_month)} tone="text-red-600 dark:text-red-300" />
        <Metric label="Average Daily Spending" value={money(data.overview.average_daily)} />
        <Metric label="Highest Spending Category" value={data.overview.highest_category?.category || 'None'} />
      </div>
      <Card>
        <form onSubmit={add} className="grid gap-3 md:grid-cols-[130px_180px_1fr_160px_auto]">
          <Input label="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">Category<select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Button className="self-end">Add</Button>
        </form>
      </Card>
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <Input label="Month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">Category<select className="input" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid gap-3">
          {data.expenses.map((expense) => <div key={expense.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-gray-800"><div><b className="text-red-600 dark:text-red-300">{money(expense.amount)}</b><p className="text-sm text-gray-500">{expense.category} - {expense.date || expense.spent_at}</p><p className="text-sm text-gray-500">{expense.description}</p></div><button onClick={() => remove(expense.id)} className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"><Trash2 size={16} /></button></div>)}
          {!data.expenses.length && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-gray-500 dark:border-gray-800">No expenses found.</div>}
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, tone = 'text-gray-950 dark:text-white' }) {
  return <Card><p className="text-sm text-gray-500 dark:text-gray-400">{label}</p><p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p></Card>;
}
