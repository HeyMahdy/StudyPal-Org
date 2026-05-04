import { Menu, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-slate-100/90 px-6 backdrop-blur dark:border-gray-800 dark:bg-appdark/90 lg:pl-72">
      <div className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
        <Menu className="lg:hidden" size={20} />
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 sm:flex">
          <Search size={16} />
          Search StudyPal
        </div>
      </div>
      <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.name || 'Student'}</div>
    </header>
  );
}
