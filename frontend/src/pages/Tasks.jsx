import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TaskItem from '../components/tasks/TaskItem';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import api from '../services/api';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '', due: '', sort: 'due_date' });

  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
  const load = () => api.get(`/tasks${query ? `?${query}` : ''}`).then((res) => setTasks(res.data.tasks));

  useEffect(() => {
    load();
  }, [query]);

  const updateTask = async (task, patch) => {
    const nextTask = { ...task, ...patch };
    if (patch.status) nextTask.completed = patch.status === 'completed' ? 1 : 0;
    setTasks((items) => items.map((item) => (item.id === task.id ? nextTask : item)));
    const res = await api.put(`/tasks/${task.id}`, patch);
    setTasks((items) => items.map((item) => (item.id === task.id ? res.data.task : item)));
  };

  const updateStatus = async (task, status) => {
    const nextTask = { ...task, status, completed: status === 'completed' ? 1 : 0 };
    setTasks((items) => items.map((item) => (item.id === task.id ? nextTask : item)));
    const res = await api.patch(`/tasks/${task.id}/status`, { status });
    setTasks((items) => items.map((item) => (item.id === task.id ? res.data.task : item)));
  };

  const deleteTask = async (id) => {
    const previous = tasks;
    setTasks((items) => items.filter((item) => item.id !== id));
    try {
      await api.delete(`/tasks/${id}`);
    } catch {
      setTasks(previous);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-gray-500 dark:text-gray-400">Filter quickly, update priority, and open details when needed.</p>
        </div>
        <Link to="/tasks/new" className="btn-primary">
          <Plus size={16} />
          Add Task
        </Link>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Input label="Search" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Title or description" />
          <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">Status<select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All</option><option value="todo">Todo</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
          <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">Priority<select className="input" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}><option value="">All</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
          <Input label="Category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} placeholder="Any" />
          <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">Due<select className="input" value={filters.due} onChange={(e) => setFilters({ ...filters, due: e.target.value })}><option value="">Any</option><option value="today">Today</option><option value="upcoming">Upcoming</option><option value="overdue">Overdue</option></select></label>
          <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">Sort<select className="input" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}><option value="due_date">Due date</option><option value="priority">Priority</option><option value="created_at">Created date</option></select></label>
        </div>
      </Card>

      <Card>
        <div className="grid gap-3">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={(item) => updateStatus(item, item.status === 'completed' || item.completed ? 'todo' : 'completed')}
              onPriorityChange={(item, priority) => updateTask(item, { priority })}
              onDelete={deleteTask}
            />
          ))}
          {!tasks.length && <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-gray-500 dark:border-gray-800">No tasks match the current filters.</div>}
        </div>
      </Card>
    </div>
  );
}
