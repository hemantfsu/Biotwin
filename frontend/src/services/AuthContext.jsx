import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('biotwin_token');
    if (!token) { setLoading(false); return; }
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
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
