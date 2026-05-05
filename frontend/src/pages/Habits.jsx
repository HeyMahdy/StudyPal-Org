import { Flame, Minus, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';
import { today } from '../utils/format';

const weekLabel = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);

export default function Habits() {
  const navigate = useNavigate();
  const [date, setDate] = useState(today());
  const [habits, setHabits] = useState([]);
  const [overview, setOverview] = useState({ completed_today: 0, total_habits: 0, best_streak: 0, weekly_completion_rate: 0 });

  const load = () => api.get(`/habits?date=${date}`).then((res) => {
    setHabits(res.data.habits);
    setOverview(res.data.overview);
  });

  useEffect(() => { load(); }, [date]);

  const logHabit = async (habit, value) => {
    const numericValue = Math.max(0, Number(value));
    const completed = habit.type === 'boolean' ? numericValue >= 1 : numericValue >= Number(habit.target_value || 1);
    setHabits((items) => items.map((item) => item.id === habit.id ? { ...item, today_value: numericValue, completed_today: completed } : item));
    await api.post('/habits/log', { habit_id: habit.id, date, value: numericValue });
    load();
  };

  const deleteHabit = async (id) => {
    const previous = habits;
    setHabits((items) => items.filter((habit) => habit.id !== id));
    try {
      await api.delete(`/habits/${id}`);
      load();
    } catch {
      setHabits(previous);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Habits</h1>
          <p className="text-gray-500 dark:text-gray-400">Quick daily check-ins with clear streak momentum.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Input label="Log date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Link to="/habits/new" className="btn-primary">
            Add Habit
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Metric label="Habits completed today" value={`${overview.completed_today}/${overview.total_habits}`} />
        <Metric label="Current streak" value={overview.best_streak} tone="text-amber-600 dark:text-amber-300" icon />
        <Metric label="Weekly completion rate" value={`${overview.weekly_completion_rate}%`} tone="text-emerald-600 dark:text-emerald-300" />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onOpen={() => navigate(`/habits/${habit.id}?date=${date}`)}
            onLog={logHabit}
            onDelete={deleteHabit}
          />
        ))}
        {!habits.length && (
          <Card className="md:col-span-2 xl:col-span-3">
            <p className="text-center text-sm text-gray-500">No habits yet. Add one and start building consistency.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function HabitCard({ habit, onOpen, onLog, onDelete }) {
  const completed = Boolean(habit.completed_today);
  const value = Number(habit.today_value || 0);

  return (
    <Card className={`${completed ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20' : 'opacity-95'} cursor-pointer`} >
      <div onClick={onOpen}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{habit.title}</h2>
            <p className="text-sm text-gray-500">{habit.category || 'General'} - {habit.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-200">
              <Flame size={14} />
              {habit.current_streak || 0}
            </span>
            <button onClick={(event) => { event.stopPropagation(); onDelete(habit.id); }} className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="mt-5">
          {habit.type === 'boolean' ? (
            <button
              onClick={(event) => { event.stopPropagation(); onLog(habit, completed ? 0 : 1); }}
              className={`w-full rounded-2xl px-4 py-3 text-sm font-bold transition ${completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-gray-700 hover:bg-slate-200 dark:bg-gray-800 dark:text-gray-200'}`}
            >
              {completed ? 'Done today' : 'Mark done'}
            </button>
          ) : (
            <div className="grid gap-3" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between rounded-2xl bg-slate-100 p-2 dark:bg-gray-950">
                <button onClick={() => onLog(habit, value - 1)} className="rounded-xl bg-white p-2 text-gray-700 dark:bg-gray-900 dark:text-gray-200"><Minus size={16} /></button>
                <div className="text-center">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-gray-500">target {habit.target_value}</p>
                </div>
                <button onClick={() => onLog(habit, value + 1)} className="rounded-xl bg-white p-2 text-gray-700 dark:bg-gray-900 dark:text-gray-200"><Plus size={16} /></button>
              </div>
              <input className="input" type="number" min="0" value={value} onChange={(e) => onLog(habit, e.target.value)} />
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-7 gap-2">
          {(habit.weekly || []).map((day) => (
            <div key={day.date} className="grid gap-1 text-center">
              <span className="text-xs text-gray-400">{weekLabel(day.date)}</span>
              <span className={`h-8 rounded-xl ${day.completed ? 'bg-primary' : 'bg-slate-100 opacity-60 dark:bg-gray-800'}`} title={day.date} />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value, tone = 'text-gray-950 dark:text-white', icon = false }) {
  return (
    <Card>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-2 inline-flex items-center gap-2 text-2xl font-bold ${tone}`}>
        {icon && <Flame size={18} />}
        {value}
      </p>
    </Card>
  );
}
