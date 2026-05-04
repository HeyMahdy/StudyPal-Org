import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('studypal_user') || 'null'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('studypal_token');
    if (!token) return;
    setLoading(true);
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  const persist = (payload) => {
    localStorage.setItem('studypal_token', payload.token);
    localStorage.setItem('studypal_user', JSON.stringify(payload.user));
    setUser(payload.user);
  };

  const login = async (form) => {
    const res = await api.post('/auth/login', form);
    persist(res.data);
  };

  const register = async (form) => {
    const res = await api.post('/auth/register', form);
    persist(res.data);
  };

  const logout = () => {
    localStorage.removeItem('studypal_token');
    localStorage.removeItem('studypal_user');
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, register, logout, isAuthed: Boolean(user) }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
