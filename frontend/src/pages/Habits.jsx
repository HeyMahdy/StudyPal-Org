import { Flame, Minus, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import ProgressBar from '../components/ui/ProgressBar';
import api from '../services/api';
import { today } from '../utils/format';

const weekLabel = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);

export default function Habits() {
  const navigate = useNavigate();
  const [date, setDate] = useState(today());
  const [habits, setHabits] = useState([]);
  const [overview, setOverview] = useState({ completed_today: 0, total_habits: 0, best_streak: 0, weekly_completion_rate: 0 });
  const totalHabits = Number(overview.total_habits || 0);
  const completedToday = Number(overview.completed_today || 0);
  const todayCompletionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

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
      <Card className="habits-hero">
        <div className="habits-hero-copy">
          <p className="habits-kicker">Habit Lab</p>
          <h1 className="habits-title">Habits</h1>
          <p className="habits-subtitle">Track micro-wins, build streaks, and keep your weekly rhythm visible.</p>
        </div>
        <div className="habits-hero-controls">
          <Input label="Log date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Link to="/habits/new" className="btn-primary">
            Add Habit
          </Link>
        </div>
        <div className="habits-hero-metrics">
          <div className="habits-metric">
            <p className="habits-metric-label">Today</p>
            <p className="habits-metric-value">{completedToday}/{totalHabits}</p>
            <span className="habits-metric-foot">{todayCompletionRate}% completion</span>
          </div>
          <div className="habits-metric">
            <p className="habits-metric-label">Best streak</p>
            <p className="habits-metric-value">
              <Flame size={16} />{overview.best_streak}
            </p>
            <span className="habits-metric-foot">Longest run so far</span>
          </div>
          <div className="habits-metric">
            <p className="habits-metric-label">Weekly rate</p>
            <p className="habits-metric-value">{overview.weekly_completion_rate}%</p>
            <span className="habits-metric-foot">Last 7 days</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="habits-progress">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="habits-section-label">Momentum</p>
              <h2 className="habits-section-title">Daily rhythm</h2>
            </div>
            <span className="habits-chip"><Sparkles size={14} />Focus</span>
          </div>
          <div className="mt-4 grid gap-4">
            <ProgressBar label="Habits completed" value={completedToday} total={totalHabits} color="bg-emerald-500" />
            <ProgressBar label="Weekly consistency" value={overview.weekly_completion_rate} total={100} color="bg-amber-500" format={(v) => `${v}%`} />
          </div>
        </Card>
        <Card className="habits-highlight">
          <p className="habits-section-label">Streak watch</p>
          <h2 className="habits-section-title">Best streak pulse</h2>
          <p className="habits-highlight-value">
            <Flame size={20} />{overview.best_streak} days
          </p>
          <p className="habits-highlight-copy">Keep the chain alive for two more days to set a new record.</p>
        </Card>
      </div>

      <Card className="habits-map">
        <div className="habits-map-head">
          <div>
            <p className="habits-section-label">Habit map</p>
            <h2 className="habits-section-title">Last 7 days</h2>
          </div>
          <p className="habits-map-meta">Tap a habit to log or edit.</p>
        </div>
        {habits.length ? (
          <div className="habits-map-grid">
            <div className="habits-map-header">
              <span>Habit</span>
              <div className="habits-map-days">
                {(habits[0]?.weekly || []).map((day) => (
                  <span key={day.date}>{weekLabel(day.date)}</span>
                ))}
              </div>
            </div>
            {habits.map((habit) => (
              <button key={habit.id} type="button" className="habits-map-row" onClick={() => navigate(`/habits/${habit.id}?date=${date}`)}>
                <div className="habits-map-title">
                  <span className="habits-map-name">{habit.title}</span>
                  <span className="habits-map-meta">{habit.category || 'General'}</span>
                </div>
                <div className="habits-map-days">
                  {(habit.weekly || []).map((day) => (
                    <span key={day.date} className={`habits-map-cell ${day.completed ? 'is-on' : 'is-off'}`} title={day.date} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="habits-empty">No habits yet. Add one to start your map.</p>
        )}
      </Card>

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
