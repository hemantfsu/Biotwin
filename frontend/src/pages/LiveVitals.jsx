import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';

const WS_URL = process.env.REACT_APP_WS_URL || `http://${window.location.hostname}:5001`;
const API_POLL_INTERVAL = 30000;
const MAX_POINTS = 60;

const VITAL_CARDS = [
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: '💓', color: '#ef4444', gradient: 'from-red-500 to-rose-500', bg: 'bg-red-50', border: 'border-red-200/60', normal: [60, 100] },
  { key: 'spo2', label: 'SpO2', unit: '%', icon: '🫁', color: '#3b82f6', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', border: 'border-blue-200/60', normal: [95, 100] },
  { key: 'systolicBP', label: 'Blood Pressure', unit: 'mmHg', icon: '🩺', color: '#8b5cf6', gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', border: 'border-violet-200/60', normal: [90, 140], extra: 'diastolicBP' },
  { key: 'temperature', label: 'Temperature', unit: '°F', icon: '🌡️', color: '#f59e0b', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-200/60', normal: [97, 99.5] },
  { key: 'respiratoryRate', label: 'Resp Rate', unit: '/min', icon: '🌬️', color: '#10b981', gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-200/60', normal: [12, 20] },
  { key: 'steps', label: 'Steps', unit: 'steps', icon: '🚶', color: '#6366f1', gradient: 'from-indigo-500 to-brand-500', bg: 'bg-indigo-50', border: 'border-indigo-200/60', normal: [0, 999999] },
];

const getStatus = (value, [lo, hi]) => {
  if (value == null) return 'none';
  return value >= lo && value <= hi ? 'normal' : 'warning';
};

const formatTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.[0]) {
    return (
      <div className="glass-card-static px-3 py-2 text-xs !rounded-lg">
        <p className="text-slate-400">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="font-bold" style={{ color: p.stroke }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
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

  const refreshStats = useCallback(async () => {
    try {
      const res = await api.get('/vitals/stats');
      if (res.data.success) setStats(res.data.data);
    } catch { /* ignore */ }
  }, []);

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
      } catch { /* ok */ }
    };
    loadHistory();
    const statsInterval = setInterval(refreshStats, API_POLL_INTERVAL);
    return () => clearInterval(statsInterval);
  }, [refreshStats]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshStats();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refreshStats]);

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
      setConnected(true);
      socket.emit('join:user', userId);
      socket.emit('join:feed');
    });
    socket.on('disconnect', () => setConnected(false));
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl">⌚</div>
          <div>
            <h1 className="page-title">Live Vitals Monitor</h1>
            <p className="page-subtitle">Real-time health data from your smartwatch</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            connected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {connected ? <span className="live-dot" /> : <div className="w-2 h-2 rounded-full bg-red-500" />}
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          <span className="text-xs text-slate-400 font-medium">{ago}</span>
          <button
            onClick={simulating ? stopSimulator : startSimulator}
            className={simulating ? 'btn-secondary !py-2 !px-4 !text-xs !border-red-200 !text-red-600 !bg-red-50 hover:!bg-red-100' : 'btn-primary !py-2 !px-4 !text-xs'}
          >
            {simulating ? '⏹ Stop Simulator' : '▶ Start Simulator'}
          </button>
        </div>
      </div>

      {/* Vital Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {VITAL_CARDS.map((card, idx) => {
          const value = latest?.[card.key];
          const status = getStatus(value, card.normal);
          const extraVal = card.extra ? latest?.[card.extra] : null;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative glass-card-static p-4 overflow-hidden ${
                status === 'warning' ? 'ring-2 ring-red-400/60 ring-offset-1' : ''
              }`}
            >
              {/* Subtle top gradient bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} rounded-t-2xl`} />
              {status === 'warning' && <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />}
              <div className="text-xl mb-2 mt-1">{card.icon}</div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-2xl font-extrabold mt-1 tabular-nums" style={{ color: card.color }}>
                {value != null ? (
                  <>
                    {card.key === 'steps' ? value.toLocaleString() : value}
                    {extraVal != null && <span className="text-sm font-medium text-slate-400">/{extraVal}</span>}
                  </>
                ) : <span className="text-slate-200">--</span>}
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5 font-medium">{card.unit}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.slice(0, 4).map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${
                  a.type === 'critical'
                    ? 'bg-red-50/80 border-red-200 text-red-700'
                    : 'bg-amber-50/80 border-amber-200 text-amber-700'
                }`}
              >
                <span className="text-lg">{a.type === 'critical' ? '🚨' : '⚠️'}</span>
                <span className="flex-1">{a.msg}</span>
                <span className="text-[10px] opacity-50">{formatTime(a.ts)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Charts */}
      {history.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { title: '💓 Heart Rate', key: 'heartRate', color: '#ef4444', gradId: 'hrG' },
            { title: '🫁 SpO2', key: 'spo2', color: '#3b82f6', gradId: 'spo2G', domain: [85, 100] },
          ].map((chart) => (
            <div key={chart.key} className="glass-card-static p-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{chart.title}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id={chart.gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chart.color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={chart.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} />
                  <YAxis domain={chart.domain || ['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2} fill={`url(#${chart.gradId})`} dot={false} connectNulls isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}

          <div className="glass-card-static p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">🩺 Blood Pressure</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="systolicBP" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Systolic" connectNulls isAnimationActive={false} />
                <Line type="monotone" dataKey="diastolicBP" stroke="#c4b5fd" strokeWidth={2} dot={false} name="Diastolic" connectNulls isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card-static p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">🌡️ Temperature</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="tempG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} />
                <YAxis domain={[96, 104]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} fill="url(#tempG)" dot={false} connectNulls isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && stats.count > 0 && (
        <div className="glass-card-static p-6">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">📊 Today's Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Readings', value: stats.count, icon: '📡' },
              { label: 'Avg HR', value: stats.avgHR?.toFixed?.(0) || stats.avgHR, unit: 'bpm', icon: '💓' },
              { label: 'HR Range', value: `${stats.minHR || '-'}–${stats.maxHR || '-'}`, icon: '📈' },
              { label: 'Avg SpO2', value: stats.avgSpo2?.toFixed?.(1) || stats.avgSpo2, unit: '%', icon: '🫁' },
              { label: 'Avg BP', value: `${stats.avgSystolic?.toFixed?.(0) || '-'}/${stats.avgDiastolic?.toFixed?.(0) || '-'}`, icon: '🩺' },
              { label: 'Steps', value: stats.totalSteps?.toLocaleString?.() || '-', icon: '🚶' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{s.icon} {s.label}</p>
                <p className="text-lg font-extrabold text-slate-800 mt-1 tabular-nums">
                  {s.value} <span className="text-[10px] font-medium text-slate-400">{s.unit || ''}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!latest && !simulating && (
        <div className="text-center py-20 glass-card-static">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center text-4xl mb-5">
              ⌚
            </div>
            <h3 className="text-xl font-bold text-slate-700">No Live Data Yet</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              Connect your smartwatch via BioTwinSync, or start the simulator for a live demo.
            </p>
            <button onClick={startSimulator} className="btn-primary mt-6">
              ▶ Start Live Simulator
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
