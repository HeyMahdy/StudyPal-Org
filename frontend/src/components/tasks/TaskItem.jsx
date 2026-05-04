import { Trash2 } from 'lucide-react';

export default function TaskItem({ task, onToggle, onDelete }) {
  const priority = { low: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 dark:border-gray-800">
      <input type="checkbox" checked={Boolean(task.completed)} onChange={() => onToggle(task)} className="h-5 w-5 accent-primary" />
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>{task.title}</p>
        <p className="text-sm text-gray-500">{task.due_date || 'No due date'}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priority[task.priority]}`}>{task.priority}</span>
      <button onClick={() => onDelete(task.id)} className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
        <Trash2 size={16} />
      </button>
    </div>
  );
}
