import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-gray-900 dark:bg-appdark dark:text-gray-100">
      <Sidebar />
      <Topbar />
      <main className="px-5 py-6 sm:px-8 lg:pl-72">
        <Outlet />
      </main>
    </div>
  );
}
