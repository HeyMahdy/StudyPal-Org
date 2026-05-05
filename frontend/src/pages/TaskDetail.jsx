import { ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ErrorAlert from '../components/shared/ErrorAlert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/tasks/${id}`)
      .then((res) => setTask(res.data.task))
      .catch((err) => setError(err.message));
  }, [id]);

  const save = async (event) => {
    event.preventDefault();
    if (!task.title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    const res = await api.put(`/tasks/${id}`, { ...task, title: task.title.trim() });
    setTask(res.data.task);
  };

  const remove = async () => {
    await api.delete(`/tasks/${id}`);
    navigate('/tasks');
  };

  if (!task) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card>{error || 'Loading task...'}</Card>
      </div>
    );
  }

  const isCompleted = task.status === 'completed' || Boolean(task.completed);
  const isOverdue = task.due_date && task.due_date < new Date().toISOString().slice(0, 10) && !isCompleted;

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <Link to="/tasks" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary">
        <ArrowLeft size={16} />
        Back to tasks
      </Link>
      <Card className={`${isCompleted ? 'opacity-80' : ''} ${isOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' : ''}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={`text-3xl font-bold ${isCompleted ? 'text-gray-400 line-through' : ''}`}>Task details</h1>
            {isOverdue && <span className="mt-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-200">Overdue</span>}
          </div>
          <p className="text-sm text-gray-500">Created {task.created_at || 'recently'}</p>
        </div>

        <form onSubmit={save} className="mt-6 grid gap-4">
          <ErrorAlert message={error} />
          <Input label="Title" value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} required />
          <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            Description
            <textarea className="input min-h-44" value={task.description || ''} onChange={(e) => setTask({ ...task, description: e.target.value })} />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">Priority<select className="input" value={task.priority || 'medium'} onChange={(e) => setTask({ ...task, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">Status<select className="input" value={task.status || 'todo'} onChange={(e) => setTask({ ...task, status: e.target.value })}><option value="todo">Todo</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
            <Input label="Category" value={task.category || ''} onChange={(e) => setTask({ ...task, category: e.target.value })} />
            <Input label="Due date" type="date" value={task.due_date || ''} onChange={(e) => setTask({ ...task, due_date: e.target.value })} />
          </div>
          <div className="flex flex-wrap justify-between gap-3">
            <button type="button" onClick={remove} className="btn-secondary text-red-600 dark:text-red-300">
              <Trash2 size={16} />
              Delete task
            </button>
            <Button>Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
