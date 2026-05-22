export default function ProgressBar({ label, value, total, color = 'bg-primary', format = (v) => v }) {
  const percentage = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${color}`}></div>
          <span className="font-medium">{label}</span>
        </div>
        <div className="text-gray-500">
          <span className="font-semibold text-gray-900 dark:text-white">{format(value)}</span>
          {total > 0 && <span> / {format(total)}</span>}
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
