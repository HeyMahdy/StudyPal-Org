import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AI from './pages/AI';
import Calendar from './pages/Calendar';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Habits from './pages/Habits';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Notes from './pages/Notes';
import Register from './pages/Register';
import Tasks from './pages/Tasks';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/ai" element={<AI />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
