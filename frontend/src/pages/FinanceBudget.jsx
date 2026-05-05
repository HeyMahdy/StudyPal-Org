import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';

const categories = ['Food', 'Rent', 'Transport', 'Entertainment', 'Books', 'Health', 'Other'];
const money = (value) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(value || 0));
const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function FinanceBudget() {
  const [month, setMonth] = useState(currentMonth());
  const [budget, setBudget] = useState({ categories: [], total_budget: 0, total_spent: 0, remaining_budget: 0 });
  const [form, setForm] = useState({ category: 'Food', limit_amount: '' });
  const [editingId, setEditingId] = useState(null);

  const load = () => api.get(`/budget?month=${month}`).then((res) => setBudget(res.data.budget));
  useEffect(() => { load(); }, [month]);

  const save = async (event) => {
    event.preventDefault();
    const payload = { ...form, month };
    if (editingId) await api.put(`/budget/${editingId}`, payload);
    else await api.post('/budget', payload);
    setForm({ category: 'Food', limit_amount: '' });
    setEditingId(null);
    load();
  };

  const utilization = budget.total_budget ? Math.round((budget.total_spent / budget.total_budget) * 100) : 0;

  return (
    <div className="grid gap-6">
      <Link to="/finance" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary">
        <ArrowLeft size={16} />
        Back to Finance
      </Link>
      <Header title="Budget Management" subtitle="Set monthly limits and see what is left before you spend." month={month} setMonth={setMonth} />
      <div className="grid gap-5 md:grid-cols-4">
        <Metric label="Total Monthly Budget" value={money(budget.total_budget)} />
        <Metric label="Total Spent This Month" value={money(budget.total_spent)} tone="text-red-600 dark:text-red-300" />
        <Metric label="Remaining Budget" value={money(budget.remaining_budget)} tone={budget.remaining_budget < 0 ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'} />
        <Metric label="Budget Utilization" value={`${utilization}%`} tone={utilization > 100 ? 'text-red-600 dark:text-red-300' : utilization >= 85 ? 'text-amber-600 dark:text-amber-300' : 'text-gray-950 dark:text-white'} />
      </div>

      <Card>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
          <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">Category<select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <Input label="Limit amount" type="number" min="0" value={form.limit_amount} onChange={(e) => setForm({ ...form, limit_amount: e.target.value })} required />
          <Button className="self-end">{editingId ? 'Save Budget' : 'Create Budget'}</Button>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {budget.categories.map((item) => (
          <Card key={item.category} className={item.flag === 'overbudget' ? 'border-red-300 shadow-[0_0_24px_rgba(239,68,68,0.18)] dark:border-red-800' : ''}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{item.category}</h2>
                <p className="text-sm text-gray-500">Remaining {money(item.remaining_budget)}</p>
              </div>
              {item.id && (
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(item.id); setForm({ category: item.category, limit_amount: item.limit_amount }); }} className="rounded-xl p-2 text-gray-400 hover:bg-slate-100 hover:text-primary dark:hover:bg-gray-800"><Edit2 size={16} /></button>
                  <button onClick={() => api.delete(`/budget/${item.id}`).then(load)} className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between text-sm text-gray-500"><span>Spent {money(item.spent)}</span><span>Limit {money(item.limit_amount)}</span></div>
            <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-gray-800"><div className={`h-2 rounded-full ${item.flag === 'overbudget' ? 'bg-red-500' : item.flag === 'near_limit' ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${Math.min(100, item.used_percent)}%` }} /></div>
          </Card>
        ))}
        {!budget.categories.length && <Card className="md:col-span-2 xl:col-span-3"><p className="text-center text-sm text-gray-500">No budgets yet. Create one to start tracking limits.</p></Card>}
      </div>
    </div>
  );
}

function Header({ title, subtitle, month, setMonth }) {
  return <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">{title}</h1><p className="text-gray-500 dark:text-gray-400">{subtitle}</p></div><Input label="Month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>;
}

function Metric({ label, value, tone = 'text-gray-950 dark:text-white' }) {
  return <Card><p className="text-sm text-gray-500 dark:text-gray-400">{label}</p><p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p></Card>;
}
