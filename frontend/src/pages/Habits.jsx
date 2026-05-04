import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';
import { today } from '../utils/format';

const defaults = [
  ['water', 'Water intake', 8],
  ['sleep', 'Sleep hours', 8],
  ['study', 'Study hours', 4],
  ['workout', 'Workout minutes', 30]
];

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [date, setDate] = useState(today());
  const [values, setValues] = useState({});
  const load = () => api.get('/habits').then((res) => setHabits(res.data.habits));
  useEffect(() => { load(); }, []);

  const save = async (type, target) => {
    await api.post('/habits', { type, value: values[type] || 0, target, entry_date: date });
    load();
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">Habits</h1>
        <Input label="Entry date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {defaults.map(([type, label, target]) => {
          const latest = habits.find((h) => h.type === type);
          return (
            <Card key={type}>
              <h2 className="text-xl font-bold">{label}</h2>
              <p className="mt-1 text-sm text-gray-500">Target {target} · Streak {latest?.streak || 0}</p>
              <div className="mt-5 grid gap-3">
                <input className="accent-primary" type="range" min="0" max={target * 2} step="0.5" value={values[type] || 0} onChange={(e) => setValues({ ...values, [type]: e.target.value })} />
                <div className="text-2xl font-bold">{values[type] || 0}</div>
                <Button onClick={() => save(type, target)}>Save</Button>
              </div>
            </Card>
          );
        })}
      </div>
      <Card>
        <h2 className="text-xl font-bold">Recent entries</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{habits.slice(0, 10).map((h) => <div key={h.id} className="rounded-2xl border border-slate-200 p-3 dark:border-gray-800"><b>{h.type}</b><p className="text-sm text-gray-500">{h.entry_date}: {h.value}/{h.target}</p></div>)}</div>
      </Card>
    </div>
  );
}
