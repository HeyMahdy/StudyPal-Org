import { Activity, CalendarDays, CheckSquare, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import StatCard from '../components/dashboard/StatCard';
import EmptyState from '../components/shared/EmptyState';
import Card from '../components/ui/Card';
import api from '../services/api';
import { currency } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/overview').then((res) => setData(res.data));
  }, []);

  if (!data) return <div>Loading dashboard...</div>;
  const completed = data.taskStats.completed || 0;
  const total = data.taskStats.total || 0;
  const spent = data.finance.reduce((sum, row) => sum + Number(row.total), 0);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Your day at a glance.</p>
      </div>
      <div className="grid gap-5 md:grid-cols-4">
        <StatCard icon={CheckSquare} label="Tasks done" value={`${completed}/${total}`} />
        <StatCard icon={CalendarDays} label="Upcoming events" value={data.upcomingEvents.length} />
        <StatCard icon={DollarSign} label="Tracked spend" value={currency(spent)} />
        <StatCard icon={Activity} label="Habit entries" value={data.habits.length} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-xl font-bold">Finance summary</h2>
          <div className="mt-5 h-64">
            <Bar data={{ labels: data.finance.map((x) => x.category), datasets: [{ data: data.finance.map((x) => x.total), backgroundColor: '#4F46E5' }] }} options={{ maintainAspectRatio: false }} />
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">AI suggestions</h2>
          <div className="mt-4 grid gap-3">
            {data.suggestions.map((item) => <div key={item} className="rounded-2xl bg-slate-100 p-3 text-sm dark:bg-gray-950">{item}</div>)}
          </div>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Upcoming tasks</h2>
          <div className="mt-4 grid gap-3">{data.upcomingTasks.length ? data.upcomingTasks.map((t) => <p key={t.id} className="rounded-2xl border border-slate-200 p-3 dark:border-gray-800">{t.title}</p>) : <EmptyState title="No active tasks" text="Create tasks to fill this list." />}</div>
        </Card>
        <Card>
          <h2 className="text-xl font-bold">Calendar preview</h2>
          <div className="mt-4 grid gap-3">{data.upcomingEvents.length ? data.upcomingEvents.map((e) => <p key={e.id} className="rounded-2xl border border-slate-200 p-3 dark:border-gray-800">{e.title}</p>) : <EmptyState title="No events" text="Add events from the calendar page." />}</div>
        </Card>
      </div>
    </div>
  );
}
