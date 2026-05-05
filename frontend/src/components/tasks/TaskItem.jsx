import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TaskItem({ task, onToggle, onPriorityChange, onDelete }) {
  const navigate = useNavigate();
  const status = task.status || (task.completed ? 'completed' : 'todo');
  const isCompleted = status === 'completed' || Boolean(task.completed);
  const isOverdue = task.due_date && task.due_date < new Date().toISOString().slice(0, 10) && !isCompleted;
  const priority = {
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
    high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200'
  };

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      className={`group flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-soft dark:border-gray-800 ${isCompleted ? 'opacity-70' : ''} ${isOverdue ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' : ''}`}
    >
      <input
        type="checkbox"
        checked={isCompleted}
        onClick={(event) => event.stopPropagation()}
        onChange={() => onToggle(task)}
        className="h-5 w-5 accent-primary"
      />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span>{task.due_date || 'No due date'}</span>
          {isOverdue && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-200">Overdue</span>}
          {task.category && <span>{task.category}</span>}
        </div>
      </div>
      <select
        value={task.priority || 'medium'}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onPriorityChange(task, event.target.value)}
        className={`rounded-full border-0 px-3 py-1 text-xs font-semibold outline-none ${priority[task.priority || 'medium']}`}
      >
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
      </select>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onDelete(task.id);
        }}
        className="rounded-xl p-2 text-gray-400 opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label="Delete task"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
