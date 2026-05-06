import { ArrowRight, Brain, DollarSign, ReceiptText, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import api from '../services/api';

const money = (value) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(value || 0));
const currentMonth = () => new Date().toISOString().slice(0, 7);

const modules = [
  {
    title: 'Budget Management',
    description: 'Set and track monthly budgets',
    button: 'Open Budget',
    to: '/finance/budget',
    icon: WalletCards
  },
  {
    title: 'AI Expense Capture',
    description: 'Parse receipts or text with the agent',
    button: 'Open AI Expenses',
    to: '/finance/ai-expenses',
    icon: Brain
  },
  {
    title: 'Expense Tracking',
    description: 'Track daily spending',
    button: 'Open Expenses',
    to: '/finance/expenses',
    icon: DollarSign
  },
  {
    title: 'Bill Reminders',
    description: 'Manage upcoming payments',
    button: 'Open Bills',
    to: '/finance/bills',
    icon: ReceiptText
  }
];

export default function Finance() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState({ totalBudget: 0, totalExpenses: 0, remainingMoney: 0, pendingBills: 0 });

  useEffect(() => {
    const month = currentMonth();
    Promise.all([
      api.get(`/budget?month=${month}`),
      api.get(`/expenses?month=${month}`),
      api.get('/bills')
    ]).then(([budgetRes, expenseRes, billRes]) => {
      const totalBudget = budgetRes.data.budget.total_budget;
      const totalExpenses = expenseRes.data.overview.total_month;
      setOverview({
        totalBudget,
        totalExpenses,
        remainingMoney: totalBudget - totalExpenses,
        pendingBills: billRes.data.bills.filter((bill) => bill.status === 'pending').length
      });
    });
  }, []);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold">Finance</h1>
        <p className="text-gray-500 dark:text-gray-400">Your student money control center.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Budget" value={money(overview.totalBudget)} />
        <Metric label="Total Expenses" value={money(overview.totalExpenses)} tone="text-red-600 dark:text-red-300" />
        <Metric label="Remaining Money" value={money(overview.remainingMoney)} tone={overview.remainingMoney < 0 ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'} />
        <Metric label="Pending Bills" value={overview.pendingBills} tone={overview.pendingBills ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {modules.map(({ title, description, button, to, icon: Icon }) => (
          <Card
            key={to}
            className="cursor-pointer transition duration-200 hover:-translate-y-1 hover:shadow-soft"
            onClick={() => navigate(to)}
          >
            <div className="flex h-full min-h-56 flex-col justify-between gap-8">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-primary dark:bg-indigo-950">
                  <Icon size={24} />
                </div>
                <h2 className="mt-5 text-2xl font-bold">{title}</h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
              </div>
              <button
                className="btn-primary w-full"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(to);
                }}
              >
                {button}
                <ArrowRight size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, tone = 'text-gray-950 dark:text-white' }) {
  return (
    <Card>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
    </Card>
  );
}
