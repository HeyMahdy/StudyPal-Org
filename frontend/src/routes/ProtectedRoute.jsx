import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthed, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-100 p-8 text-gray-900 dark:bg-appdark dark:text-gray-100">Loading StudyPal...</div>;
  return isAuthed ? <Outlet /> : <Navigate to="/login" replace />;
}
