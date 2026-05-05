import { ArrowLeft, Flame, Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ErrorAlert from '../components/shared/ErrorAlert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';
import { today } from '../utils/format';

const weekLabel = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);

export default function HabitDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const date = searchParams.get('date') || today();
  const [habit, setHabit] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get(`/habits/${id}?date=${date}`).then((res) => setHabit(res.data.habit)).catch((err) => setError(err.message));
  useEffect(() => { load(); }, [id, date]);

  const save = async (event) => {
    event.preventDefault();
    if (!habit.title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    const res = await api.put(`/habits/${id}`, { title: habit.title.trim(), category: habit.category, type: habit.type, target_value: habit.target_value });
    setHabit((current) => ({ ...current, ...res.data.habit }));
    load();
  };

  const remove = async () => {
    await api.delete(`/habits/${id}`);
    navigate('/habits');
  };

  const logHabit = async (value) => {
    const numericValue = Math.max(0, Number(value));
    setHabit((current) => ({ ...current, today_value: numericValue, completed_today: current.type === 'boolean' ? numericValue >= 1 : numericValue >= Number(current.target_value || 1) }));
    const res = await api.post('/habits/log', { habit_id: id, date, value: numericValue });
    setHabit(res.data.habit);
  };

  if (!habit) {
    return <div className="mx-auto max-w-4xl"><Card>{error || 'Loading habit...'}</Card></div>;
  }

  const value = Number(habit.today_value || 0);

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <Link to="/habits" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary">
        <ArrowLeft size={16} />
        Back to habits
      </Link>
      <Card className={habit.completed_today ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20' : ''}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Habit details</h1>
            <p className="mt-2 text-sm text-gray-500">Created {habit.created_at}</p>
          </div>
          <div className="flex gap-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-200">
              <Flame size={14} />
              {habit.current_streak}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-200">
              longest {habit.longest_streak}
            </span>
          </div>
        </div>

        <form onSubmit={save} className="mt-6 grid gap-4">
          <ErrorAlert message={error} />
          <Input label="Title" value={habit.title} onChange={(e) => setHabit({ ...habit, title: e.target.value })} required />
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Category" value={habit.category || ''} onChange={(e) => setHabit({ ...habit, category: e.target.value })} />
            <Input label="Type" value={habit.type} disabled />
            <Input label="Target value" type="number" min="1" value={habit.target_value || 1} disabled={habit.type === 'boolean'} onChange={(e) => setHabit({ ...habit, target_value: e.target.value })} />
          </div>

          <div className="grid gap-3">
            <h2 className="text-lg font-bold">Log today</h2>
            {habit.type === 'boolean' ? (
              <button
                type="button"
                onClick={() => logHabit(habit.completed_today ? 0 : 1)}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition ${habit.completed_today ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-gray-700 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-200'}`}
              >
                {habit.completed_today ? 'Done today' : 'Mark done'}
              </button>
            ) : (
              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-2 dark:bg-gray-950">
                  <button type="button" onClick={() => logHabit(value - 1)} className="rounded-xl bg-white p-2 text-gray-700 dark:bg-gray-900 dark:text-gray-200"><Minus size={16} /></button>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-gray-500">target {habit.target_value}</p>
                  </div>
                  <button type="button" onClick={() => logHabit(value + 1)} className="rounded-xl bg-white p-2 text-gray-700 dark:bg-gray-900 dark:text-gray-200"><Plus size={16} /></button>
                </div>
                <input className="input" type="number" min="0" value={value} onChange={(e) => logHabit(e.target.value)} />
              </div>
            )}
          </div>

          <div className="grid gap-3">
            <h2 className="text-lg font-bold">Last 7 days</h2>
            <div className="grid grid-cols-7 gap-2">
              {(habit.weekly || []).map((day) => (
                <div key={day.date} className="grid gap-1 text-center">
                  <span className="text-xs text-gray-400">{weekLabel(day.date)}</span>
                  <span className={`h-10 rounded-xl ${day.completed ? 'bg-primary' : 'bg-slate-100 opacity-60 dark:bg-gray-800'}`} title={day.date} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <button type="button" onClick={remove} className="btn-secondary text-red-600 dark:text-red-300">
              <Trash2 size={16} />
              Delete habit
            </button>
            <Button>Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
