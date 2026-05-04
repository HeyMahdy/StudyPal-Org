import Card from '../ui/Card';

export default function StatCard({ icon: Icon, label, value, tone = 'bg-indigo-50 text-primary dark:bg-indigo-950' }) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-950 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tone}`}>{Icon && <Icon size={22} />}</div>
      </div>
    </Card>
  );
}
