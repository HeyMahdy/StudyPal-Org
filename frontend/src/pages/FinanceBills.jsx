import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';
import { today } from '../utils/format';

const money = (value) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function FinanceBills() {
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState({ title: '', amount: '', due_date: today() });
  const load = () => api.get('/bills').then((res) => setBills(res.data.bills));
  useEffect(() => { load(); }, []);

  const add = async (event) => {
    event.preventDefault();
    const temp = { ...form, id: `temp-${Date.now()}`, status: 'pending' };
    setBills((items) => [temp, ...items]);
    setForm({ title: '', amount: '', due_date: today() });
    await api.post('/bills', form);
    load();
  };

  const update = async (bill, patch) => {
    setBills((items) => items.map((item) => (item.id === bill.id ? { ...item, ...patch } : item)));
    await api.put(`/bills/${bill.id}`, { ...bill, ...patch });
    load();
  };

  const remove = async (id) => {
    const previous = bills;
    setBills((items) => items.filter((bill) => bill.id !== id));
    try { await api.delete(`/bills/${id}`); } catch { setBills(previous); }
  };

  const now = today();
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const month = new Date().toISOString().slice(0, 7);
  const upcoming = bills.filter((bill) => bill.status === 'pending' && bill.due_date >= now && bill.due_date <= nextWeek);
  const pendingTotal = bills.filter((bill) => bill.status === 'pending').reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  const overdueCount = bills.filter((bill) => bill.status === 'pending' && bill.due_date < now).length;
  const paidThisMonth = bills.filter((bill) => bill.status === 'paid' && (bill.due_date || '').startsWith(month)).length;

  return (
    <div className="grid gap-6">
      <Link to="/finance" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary">
        <ArrowLeft size={16} />
        Back to Finance
      </Link>
      <div><h1 className="text-3xl font-bold">Bill Reminders</h1><p className="text-gray-500 dark:text-gray-400">See what is due, what is late, and what is already paid.</p></div>
      <div className="grid gap-5 md:grid-cols-4">
        <Metric label="Upcoming Bills" value={upcoming.length} tone="text-amber-600 dark:text-amber-300" />
        <Metric label="Total Pending Amount" value={money(pendingTotal)} />
        <Metric label="Overdue Bills Count" value={overdueCount} tone={overdueCount ? 'text-red-600 dark:text-red-300' : 'text-gray-950 dark:text-white'} />
        <Metric label="Paid This Month Count" value={paidThisMonth} tone="text-emerald-600 dark:text-emerald-300" />
      </div>
      <Card>
        <form onSubmit={add} className="grid gap-3 md:grid-cols-[1fr_160px_180px_auto]">
          <Input label="Bill title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Amount" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Input label="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
          <Button className="self-end">Add Bill</Button>
        </form>
      </Card>
      <Card>
        <div className="grid gap-3">
          {bills.map((bill) => {
            const overdue = bill.status === 'pending' && bill.due_date < now;
            return (
              <div key={bill.id} className={`flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-gray-800 ${overdue ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20' : ''}`}>
                <div><b className={bill.status === 'paid' ? 'text-gray-400 line-through' : ''}>{bill.title}</b><p className="text-sm text-gray-500">{money(bill.amount)} due {bill.due_date}</p></div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${bill.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200' : overdue ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200'}`}>{overdue ? 'overdue' : bill.status}</span>
                  {bill.status === 'pending' && <button onClick={() => update(bill, { status: 'paid' })} className="rounded-xl p-2 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-200 dark:hover:bg-emerald-950"><Check size={16} /></button>}
                  <button onClick={() => remove(bill.id)} className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"><Trash2 size={16} /></button>
                </div>
              </div>
            );
          })}
          {!bills.length && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-gray-500 dark:border-gray-800">No bills yet.</div>}
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, tone = 'text-gray-950 dark:text-white' }) {
  return <Card><p className="text-sm text-gray-500 dark:text-gray-400">{label}</p><p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p></Card>;
}
