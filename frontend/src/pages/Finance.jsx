import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';
import { currency, today } from '../utils/format';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Finance() {
  const [data, setData] = useState({ expenses: [], summary: [] });
  const [form, setForm] = useState({ title: '', amount: '', category: 'Food', spent_at: today() });
  const load = () => api.get('/expenses').then((res) => setData(res.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/expenses', form);
    setForm({ title: '', amount: '', category: 'Food', spent_at: today() });
    load();
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Finance</h1>
      <Card>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-[1fr_140px_160px_180px_auto]">
          <Input label="Expense" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <label className="grid gap-2 text-sm font-medium">Category<select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{['Food', 'Books', 'Transport', 'Rent', 'Health', 'Other'].map((x) => <option key={x}>{x}</option>)}</select></label>
          <Input label="Date" type="date" value={form.spent_at} onChange={(e) => setForm({ ...form, spent_at: e.target.value })} required />
          <Button className="self-end">Add</Button>
        </form>
      </Card>
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card>
          <h2 className="text-xl font-bold">Monthly summary</h2>
          <div className="mt-5 h-72">
            <Doughnut data={{ labels: data.summary.map((x) => x.category), datasets: [{ data: data.summary.map((x) => x.total), backgroundColor: ['#4F46E5', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#64748B'] }] }} options={{ maintainAspectRatio: false }} />
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Expenses</h2>
          <div className="mt-4 grid gap-3">{data.expenses.map((expense) => <div key={expense.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-gray-800"><div><b>{expense.title}</b><p className="text-sm text-gray-500">{expense.category} · {expense.spent_at}</p></div><div className="flex items-center gap-3"><b>{currency(expense.amount)}</b><button onClick={() => api.delete(`/expenses/${expense.id}`).then(load)}><Trash2 size={16} /></button></div></div>)}</div>
        </Card>
      </div>
    </div>
  );
}
