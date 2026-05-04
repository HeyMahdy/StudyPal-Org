import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import TaskItem from '../components/tasks/TaskItem';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ title: '', priority: 'medium', due_date: '' });

  const load = () => api.get(`/tasks${filter ? `?filter=${filter}` : ''}`).then((res) => setTasks(res.data.tasks));
  useEffect(() => { load(); }, [filter]);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/tasks', form);
    setForm({ title: '', priority: 'medium', due_date: '' });
    load();
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Tasks</h1>
      <Card>
        <form onSubmit={create} className="grid gap-3 md:grid-cols-[1fr_160px_180px_auto]">
          <Input label="Task" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <label className="grid gap-2 text-sm font-medium">Priority<select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>low</option><option>medium</option><option>high</option></select></label>
          <Input label="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          <Button className="self-end"><Plus size={16} />Add</Button>
        </form>
      </Card>
      <Card>
        <div className="mb-4 flex gap-2">{['', 'active', 'completed'].map((item) => <button key={item || 'all'} onClick={() => setFilter(item)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${filter === item ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-gray-800'}`}>{item || 'all'}</button>)}</div>
        <div className="grid gap-3">{tasks.map((task) => <TaskItem key={task.id} task={task} onToggle={(t) => api.put(`/tasks/${t.id}`, { completed: t.completed ? 0 : 1 }).then(load)} onDelete={(id) => api.delete(`/tasks/${id}`).then(load)} />)}</div>
      </Card>
    </div>
  );
}
