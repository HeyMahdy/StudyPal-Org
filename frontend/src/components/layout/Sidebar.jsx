import { Bot, CalendarDays, CheckSquare, DollarSign, GraduationCap, Home, LogOut, Moon, NotebookPen, Sprout, Sun } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/notes', label: 'Notes', icon: NotebookPen },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/finance', label: 'Finance', icon: DollarSign },
  { to: '/habits', label: 'Habits', icon: Sprout },
  { to: '/ai', label: 'AI Assistant', icon: Bot }
];

export default function Sidebar() {
  const { logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const base = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition';

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-slate-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 lg:block">
      <div className="mb-8">
        <div className="flex items-center gap-3 text-2xl font-bold text-gray-950 dark:text-white">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white shadow-sm">
            <GraduationCap size={22} />
          </span>
          StudyPal
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Calm study control</p>
      </div>
      <nav className="grid gap-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${base} ${isActive ? 'bg-primary text-white' : 'text-gray-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-900'}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="absolute bottom-5 left-5 right-5 grid gap-2">
        <button onClick={toggleDark} className={`${base} justify-between bg-slate-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100`}>
          <span className="flex items-center gap-3">{dark ? <Sun size={18} /> : <Moon size={18} />} Theme</span>
        </button>
        <button onClick={logout} className={`${base} text-gray-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-900`}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}
