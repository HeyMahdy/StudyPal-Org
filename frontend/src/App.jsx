import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AI from './pages/AI';
import Calendar from './pages/Calendar';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import FinanceBills from './pages/FinanceBills';
import FinanceBudget from './pages/FinanceBudget';
import FinanceExpenses from './pages/FinanceExpenses';
import FinanceAIExpenses from './pages/FinanceAIExpenses';
import HabitCreate from './pages/HabitCreate';
import HabitDetail from './pages/HabitDetail';
import Habits from './pages/Habits';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Notes from './pages/Notes';
import Register from './pages/Register';
import TaskCreate from './pages/TaskCreate';
import TaskDetail from './pages/TaskDetail';
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
                <Route path="/tasks/new" element={<TaskCreate />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/finance/budget" element={<FinanceBudget />} />
                <Route path="/finance/expenses" element={<FinanceExpenses />} />
                <Route path="/finance/ai-expenses" element={<FinanceAIExpenses />} />
                <Route path="/finance/bills" element={<FinanceBills />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/habits/new" element={<HabitCreate />} />
                <Route path="/habits/:id" element={<HabitDetail />} />
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
