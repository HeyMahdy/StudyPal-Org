export default function CircularProgress({ percentage, label, subtext }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0">
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-amber-100 dark:text-gray-800"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-amber-500 transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold">{Math.round(percentage)}%</span>
        </div>
      </div>
      <div>
        <h3 className="font-semibold">{label}</h3>
        {subtext && <p className="text-sm text-gray-500">{subtext}</p>}
      </div>
    </div>
  );
}