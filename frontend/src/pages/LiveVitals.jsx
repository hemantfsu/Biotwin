import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';

// Auto-detect backend URL: same hostname as frontend, port 5001
const WS_URL = process.env.REACT_APP_WS_URL || `http://${window.location.hostname}:5001`;
const API_POLL_INTERVAL = 30000; // refresh stats every 30s
const MAX_POINTS = 60;

const VITAL_CARDS = [
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: '💓', color: '#ef4444', bg: 'from-red-50 to-red-100', border: 'border-red-200', normal: [60, 100] },
  { key: 'spo2', label: 'Blood Oxygen', unit: '%', icon: '🫁', color: '#3b82f6', bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', normal: [95, 100] },
  { key: 'systolicBP', label: 'Blood Pressure', unit: 'mmHg', icon: '🩺', color: '#8b5cf6', bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', normal: [90, 140], extra: 'diastolicBP' },
  { key: 'temperature', label: 'Temperature', unit: '°F', icon: '🌡️', color: '#f59e0b', bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', normal: [97, 99.5] },
  { key: 'respiratoryRate', label: 'Resp Rate', unit: '/min', icon: '🌬️', color: '#10b981', bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', normal: [12, 20] },
  { key: 'steps', label: 'Steps', unit: 'steps', icon: '🚶', color: '#6366f1', bg: 'from-indigo-50 to-indigo-100', border: 'border-indigo-200', normal: [0, 999999] },
];

const getStatus = (value, [lo, hi]) => {
  if (value == null) return 'none';
  return value >= lo && value <= hi ? 'normal' : 'warning';
};

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default function LiveVitals() {
  const { user } = useAuth();
  const userId = user?.id || localStorage.getItem('biotwin_userId');
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const simIntervalRef = useRef(null);

  // Refresh stats helper
  const refreshStats = useCallback(async () => {
    try {
      const res = await api.get('/vitals/stats');
      if (res.data.success) setStats(res.data.data);
    } catch { /* ignore */ }
  }, []);

  // Load history + stats on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [histRes, statsRes] = await Promise.all([
          api.get('/vitals/history?limit=60'),
          api.get('/vitals/stats'),
        ]);
        if (histRes.data.success) {
          const sorted = histRes.data.data.reverse().map((v) => ({
            ...v,
            time: formatTime(v.createdAt),
          }));
          setHistory(sorted);
          if (sorted.length > 0) {
            setLatest(sorted[sorted.length - 1]);
            setLastUpdate(new Date(sorted[sorted.length - 1].createdAt));
          }
        }
        if (statsRes.data.success) setStats(statsRes.data.data);
      } catch { /* initial load failure is ok */ }
    };
    loadHistory();

    // Auto-refresh stats every 30s
    const statsInterval = setInterval(refreshStats, API_POLL_INTERVAL);
    return () => clearInterval(statsInterval);
  }, [refreshStats]);

  // Refresh stats when page becomes visible
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshStats();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshStats]);

  // Socket.IO connection
  useEffect(() => {
    if (!userId) return;

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[BioTwin] Socket connected:', socket.id);
      setConnected(true);
      socket.emit('join:user', userId);
      socket.emit('join:feed');
    });

    socket.on('disconnect', (reason) => {
      console.log('[BioTwin] Socket disconnected:', reason);
      setConnected(false);
    });

    // Real-time vital update from backend
    socket.on('vitals:new', (vital) => {
      const point = { ...vital, time: formatTime(vital.createdAt || new Date().toISOString()) };
      setLatest(point);
      setLastUpdate(new Date(vital.createdAt || Date.now()));
      setHistory((prev) => [...prev.slice(-(MAX_POINTS - 1)), point]);
      refreshStats();
    });

    socket.on('vitals:alert', ({ alerts: newAlerts }) => {
      setAlerts((prev) => [
        ...newAlerts.map((a, i) => ({ ...a, id: Date.now() + i, ts: new Date() })),
        ...prev,
      ].slice(0, 20));
    });

    return () => { socket.disconnect(); };
  }, [userId, refreshStats]);

  // Simulator
  const startSimulator = useCallback(() => {
    if (simIntervalRef.current) return;
    setSimulating(true);
    const send = async () => {
      const data = {
        userId,
        heartRate: 65 + Math.floor(Math.random() * 35),
        systolicBP: 110 + Math.floor(Math.random() * 40),
        diastolicBP: 70 + Math.floor(Math.random() * 20),
        spo2: 94 + Math.floor(Math.random() * 6),
        temperature: +(97 + Math.random() * 3).toFixed(1),
        respiratoryRate: 12 + Math.floor(Math.random() * 10),
        steps: Math.floor(Math.random() * 15000),
        calories: Math.floor(Math.random() * 600),
        stressLevel: Math.floor(Math.random() * 80),
        source: 'simulator',
        deviceInfo: 'BioTwin Demo Simulator',
      };
      try { await api.post('/vitals', data); } catch { /* ignore */ }
    };
    send();
    simIntervalRef.current = setInterval(send, 5000);
  }, [userId]);

  const stopSimulator = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setSimulating(false);
  }, []);

  useEffect(() => () => stopSimulator(), [stopSimulator]);

  // Time since last update
  const [ago, setAgo] = useState('');
  useEffect(() => {
    const tick = () => {
      if (!lastUpdate) return setAgo('No data yet');
      const s = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
      if (s < 5) setAgo('Just now');
      else if (s < 60) setAgo(`${s}s ago`);
      else setAgo(`${Math.floor(s / 60)}m ${s % 60}s ago`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [lastUpdate]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-4xl">⌚</span> Live Vitals Monitor
          </h1>
          <p className="text-gray-500 mt-1">Real-time health data from your smartwatch</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          <span className="text-sm text-gray-400">{ago}</span>
          <button
            onClick={simulating ? stopSimulator : startSimulator}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm ${
              simulating
                ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
            }`}
          >
            {simulating ? '⏹ Stop Simulator' : '▶ Start Simulator'}
          </button>
        </div>
      </div>

      {/* Vital Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {VITAL_CARDS.map((card) => {
          const value = latest?.[card.key];
          const status = getStatus(value, card.normal);
          const extraVal = card.extra ? latest?.[card.extra] : null;
          return (
            <div key={card.key} className={`relative bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl p-4 transition-all hover:shadow-md ${status === 'warning' ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}>
              {status === 'warning' && <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
              <div className="text-2xl mb-1">{card.icon}</div>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>
                {value != null ? (
                  <>
                    {card.key === 'steps' ? value.toLocaleString() : value}
                    {extraVal != null && <span className="text-base font-normal text-gray-500">/{extraVal}</span>}
                  </>
                ) : <span className="text-gray-300">--</span>}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{card.unit}</p>
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 5).map((a) => (
            <div key={a.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
              a.type === 'critical' ? 'bg-red-50 border border-red-300 text-red-800' : 'bg-amber-50 border border-amber-300 text-amber-800'
            }`}>
              <span className="text-lg">{a.type === 'critical' ? '🚨' : '⚠️'}</span>
              {a.msg}
              <span className="ml-auto text-xs opacity-60">{formatTime(a.ts)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {history.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">💓 Heart Rate (bpm)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history}>
                <defs><linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={2} fill="url(#hrGrad)" dot={false} connectNulls isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">🫁 Blood Oxygen (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history}>
                <defs><linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="spo2" stroke="#3b82f6" strokeWidth={2} fill="url(#spo2Grad)" dot={false} connectNulls isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">🩺 Blood Pressure (mmHg)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="systolicBP" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Systolic" connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="diastolicBP" stroke="#a78bfa" strokeWidth={2} dot={false} name="Diastolic" connectNulls isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">🌡️ Temperature (°F)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history}>
                <defs><linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis domain={[96, 104]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} fill="url(#tempGrad)" dot={false} connectNulls isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Today's Stats */}
      {stats && stats.count > 0 && (
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Today's Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            {[
              { label: 'Readings', value: stats.count, icon: '📡' },
              { label: 'Avg HR', value: stats.avgHR?.toFixed?.(0) || stats.avgHR, unit: 'bpm', icon: '💓' },
              { label: 'HR Range', value: `${stats.minHR || '-'} – ${stats.maxHR || '-'}`, icon: '📈' },
              { label: 'Avg SpO2', value: stats.avgSpo2?.toFixed?.(1) || stats.avgSpo2, unit: '%', icon: '🫁' },
              { label: 'Avg BP', value: `${stats.avgSystolic?.toFixed?.(0) || '-'}/${stats.avgDiastolic?.toFixed?.(0) || '-'}`, icon: '🩺' },
              { label: 'Steps', value: stats.totalSteps?.toLocaleString?.() || '-', icon: '🚶' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-500 text-xs">{s.icon} {s.label}</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{s.value} <span className="text-xs font-normal text-gray-400">{s.unit || ''}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {!latest && !simulating && (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <div className="text-6xl mb-4">⌚</div>
          <h3 className="text-xl font-semibold text-gray-700">No Live Data Yet</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Connect your smartwatch via the BioTwinSync app, or click <strong>Start Simulator</strong> to see a live demo.
          </p>
          <button onClick={startSimulator} className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition shadow-lg">
            ▶ Start Live Simulator
          </button>
        </div>
      )}
    </div>
  );
}
