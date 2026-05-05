import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ErrorAlert from '../components/shared/ErrorAlert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';

const initialForm = { title: '', type: 'boolean', target_value: 1, category: '' };

export default function HabitCreate() {
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
    await api.post('/habits', { ...form, title: form.title.trim() });
    navigate('/habits');
  };

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Link to="/habits" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary">
        <ArrowLeft size={16} />
        Back to habits
      </Link>
      <Card>
        <h1 className="text-3xl font-bold">Create habit</h1>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <ErrorAlert message={error} />
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              Type
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, target_value: e.target.value === 'boolean' ? 1 : form.target_value })}>
                <option value="boolean">boolean</option>
                <option value="numeric">numeric</option>
              </select>
            </label>
            <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Target value" type="number" min="1" disabled={form.type === 'boolean'} value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Link to="/habits" className="btn-secondary">Cancel</Link>
            <Button>Create habit</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
