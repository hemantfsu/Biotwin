import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || `http://${window.location.hostname}:5001/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('biotwin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('biotwin_token');
      localStorage.removeItem('biotwin_userId');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
