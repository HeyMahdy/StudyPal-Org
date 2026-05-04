export default function EmptyState({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-gray-800">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{title}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}
