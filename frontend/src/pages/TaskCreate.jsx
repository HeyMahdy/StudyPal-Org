import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ErrorAlert from '../components/shared/ErrorAlert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';

const initialForm = { title: '', description: '', priority: 'medium', status: 'todo', category: '', due_date: '' };

export default function TaskCreate() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    await api.post('/tasks', { ...form, title: form.title.trim() });
    navigate('/tasks');
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Link to="/tasks" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary">
        <ArrowLeft size={16} />
        Back to tasks
      </Link>
      <Card>
        <h1 className="text-3xl font-bold">Create task</h1>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <ErrorAlert message={error} />
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            Description
            <textarea className="input min-h-36" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">Priority<select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">Status<select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="todo">Todo</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Course, exam, personal" />
            <Input label="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Link to="/tasks" className="btn-secondary">Cancel</Link>
            <Button>Create task</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
