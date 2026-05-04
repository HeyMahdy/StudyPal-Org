import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ErrorAlert from '../components/shared/ErrorAlert';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthFrame title="Welcome back" footer={<Link to="/register" className="text-primary">Create an account</Link>}>
      <form onSubmit={submit} className="grid gap-4">
        <ErrorAlert message={error} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Button>Login</Button>
      </form>
    </AuthFrame>
  );
}

export function AuthFrame({ title, children, footer }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-5 dark:bg-appdark">
      <Card className="w-full max-w-md">
        <Link to="/" className="text-2xl font-bold text-primary">StudyPal</Link>
        <h1 className="mt-6 text-3xl font-bold text-gray-950 dark:text-white">{title}</h1>
        <div className="mt-6">{children}</div>
        <div className="mt-5 text-center text-sm text-gray-500">{footer}</div>
      </Card>
    </div>
  );
}
