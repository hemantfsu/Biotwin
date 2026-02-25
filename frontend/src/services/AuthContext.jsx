import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

// Demo user for offline / live preview when backend is down
const DEMO_USER = {
  _id: 'demo_user_001',
  name: 'Hemant Baghel',
  email: 'demo@biotwin.ai',
  role: 'patient',
  createdAt: '2026-02-01T00:00:00.000Z',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('biotwin_token');
    if (!token) { setLoading(false); return; }

    // If demo mode, restore demo user without hitting API
    if (token === 'demo_token') {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem('biotwin_userId', res.data.data.id || res.data.data._id);
      })
      .catch(() => {
        localStorage.removeItem('biotwin_token');
        localStorage.removeItem('biotwin_userId');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('biotwin_token', token);
    localStorage.setItem('biotwin_userId', u.id || u._id);
    setUser(u);
    return u;
  };

  // Demo login — no backend needed
  const demoLogin = () => {
    localStorage.setItem('biotwin_token', 'demo_token');
    localStorage.setItem('biotwin_userId', DEMO_USER._id);
    localStorage.setItem('username', DEMO_USER.name);
    setUser(DEMO_USER);
    return DEMO_USER;
  };

  const register = async (name, email, password, role = 'patient') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { token, user: u } = res.data.data;
    localStorage.setItem('biotwin_token', token);
    localStorage.setItem('biotwin_userId', u.id || u._id);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('biotwin_token');
    localStorage.removeItem('biotwin_userId');
    localStorage.removeItem('username');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, demoLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
