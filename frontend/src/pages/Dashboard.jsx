import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

const CARDS = [
  { to: '/predict/lab', icon: '🧪', title: 'Lab Report Analysis', desc: 'AI-powered blood work risk assessment', color: 'from-red-50 to-red-100 border-red-200' },
  { to: '/predict/wearable', icon: '📱', title: 'Wearable Prediction', desc: 'LSTM time-series health forecasting', color: 'from-blue-50 to-blue-100 border-blue-200' },
  { to: '/predict/xray', icon: '🩻', title: 'X-Ray Analysis', desc: 'CNN-based chest X-ray screening', color: 'from-green-50 to-green-100 border-green-200' },
  { to: '/diagnose', icon: '🏥', title: 'Health Diagnosis', desc: '6-disease detection with early alerts', color: 'from-purple-50 to-purple-100 border-purple-200' },
  { to: '/live', icon: '⌚', title: 'Live Vitals', desc: 'Real-time smartwatch data dashboard', color: 'from-emerald-50 to-emerald-100 border-emerald-200' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/vitals/stats').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'User'} 👋</h1>
        <p className="mt-2 opacity-90">Your BioTwin AI digital health dashboard</p>
        <div className="flex gap-6 mt-6">
          <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2">
            <p className="text-xs opacity-80">Role</p>
            <p className="font-semibold capitalize">{user?.role || 'Patient'}</p>
          </div>
          {stats && stats.count > 0 && (
            <>
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2">
                <p className="text-xs opacity-80">Readings Today</p>
                <p className="font-semibold">{stats.count}</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2">
                <p className="text-xs opacity-80">Avg HR</p>
                <p className="font-semibold">{stats.avgHR || '--'} bpm</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Feature cards */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">AI Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className={`bg-gradient-to-br ${c.color} border rounded-2xl p-6 hover:shadow-lg transition group`}
            >
              <div className="text-4xl mb-3">{c.icon}</div>
              <h3 className="font-bold text-gray-800 group-hover:text-indigo-600 transition">{c.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
