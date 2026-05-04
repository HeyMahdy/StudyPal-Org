export default function Input({ label, className = '', ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
      {label}
      <input className={`input ${className}`} {...props} />
    </label>
  );
}
