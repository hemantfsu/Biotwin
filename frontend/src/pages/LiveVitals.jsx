import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import io from 'socket.io-client';
import api from '../services/api';

const WS_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

const VITAL_CARDS = [
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', icon: '❤️', color: '#ef4444', min: 60, max: 100 },
  { key: 'spo2', label: 'SpO₂', unit: '%', icon: '🫁', color: '#3b82f6', min: 95, max: 100 },
  { key: 'systolicBP', label: 'Systolic BP', unit: 'mmHg', icon: '🩸', color: '#f59e0b', min: 90, max: 140 },
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: '🌡️', color: '#10b981', min: 36.1, max: 37.2 },
  { key: 'respiratoryRate', label: 'Resp. Rate', unit: '/min', icon: '💨', color: '#8b5cf6', min: 12, max: 20 },
  { key: 'steps', label: 'Steps', unit: '', icon: '👟', color: '#06b6d4', min: 0, max: 99999 },
];

export default function LiveVitals() {
  const [vitals, setVitals] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const simRef = useRef(null);

  useEffect(() => {
    const socket = io(WS_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join:feed');
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('vitals:new', (data) => {
      setVitals(data);
      setHistory((h) => [...h.slice(-59), { ...data, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }]);
    });

    socket.on('vitals:alert', (alert) => {
      setAlerts((a) => [alert, ...a].slice(0, 20));
    });

    api.get('/vitals/stats').then((r) => setStats(r.data.data)).catch(() => {});

    return () => { socket.disconnect(); if (simRef.current) clearInterval(simRef.current); };
  }, []);

  const toggleSimulator = () => {
    if (simulating) {
      clearInterval(simRef.current);
      simRef.current = null;
      setSimulating(false);
    } else {
      setSimulating(true);
      const send = () => {
        const data = {
          heartRate: +(60 + Math.random() * 40).toFixed(0),
          spo2: +(95 + Math.random() * 5).toFixed(0),
          systolicBP: +(100 + Math.random() * 50).toFixed(0),
          diastolicBP: +(60 + Math.random() * 30).toFixed(0),
          temperature: +(36.2 + Math.random() * 1.8).toFixed(1),
          respiratoryRate: +(12 + Math.random() * 10).toFixed(0),
          steps: +(Math.random() * 200).toFixed(0),
        };
        api.post('/vitals', data).catch(() => {});
      };
      send();
      simRef.current = setInterval(send, 5000);
    }
  };

  const getStatusColor = (card, val) => {
    if (val === undefined || val === null) return 'text-slate-500';
    if (card.key === 'steps') return 'text-cyan-400';
    return val >= card.min && val <= card.max ? 'text-emerald-400' : 'text-red-400';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-1">Live Vitals Module</p>
          <h1 className="text-2xl font-extrabold text-white">⌚ Real-Time Vitals Monitor</h1>
          <p className="text-slate-400 text-sm mt-1">WebSocket-connected smartwatch data stream</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs text-slate-500">{connected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <button onClick={toggleSimulator}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
              simulating
                ? 'bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25'
                : 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20 hover:bg-accent-cyan/25'
            }`}>
            {simulating ? '■ Stop Simulator' : '▶ Start Simulator'}
          </button>
        </div>
      </motion.div>

      {/* Vital Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {VITAL_CARDS.map((card) => {
          const val = vitals?.[card.key];
          return (
            <motion.div key={card.key}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="dark-card-static p-4 text-center">
              <span className="text-xl">{card.icon}</span>
              <p className={`text-2xl font-black mt-1 ${getStatusColor(card, val)}`}>
                {val ?? '—'}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                {card.label}
              </p>
              {card.unit && <p className="text-[9px] text-slate-600">{card.unit}</p>}
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      {history.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Heart Rate */}
          <div className="dark-card-static p-5">
            <h3 className="font-bold text-white text-sm mb-3">❤️ Heart Rate</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.08)" />
                <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} interval="preserveEnd" />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 12, fontSize: 11 }} />
                <Area type="monotone" dataKey="heartRate" stroke="#ef4444" fill="url(#hrGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* SpO2 */}
          <div className="dark-card-static p-5">
            <h3 className="font-bold text-white text-sm mb-3">🫁 SpO₂</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="spoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.08)" />
                <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} interval="preserveEnd" />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} domain={[90, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 12, fontSize: 11 }} />
                <Area type="monotone" dataKey="spo2" stroke="#3b82f6" fill="url(#spoGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Blood Pressure */}
          <div className="dark-card-static p-5">
            <h3 className="font-bold text-white text-sm mb-3">🩸 Blood Pressure</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.08)" />
                <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} interval="preserveEnd" />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 12, fontSize: 11 }} />
                <Line type="monotone" dataKey="systolicBP" stroke="#f59e0b" strokeWidth={2} dot={false} name="Systolic" />
                <Line type="monotone" dataKey="diastolicBP" stroke="#f97316" strokeWidth={2} dot={false} name="Diastolic" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Temperature */}
          <div className="dark-card-static p-5">
            <h3 className="font-bold text-white text-sm mb-3">🌡️ Temperature</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.08)" />
                <XAxis dataKey="time" tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} interval="preserveEnd" />
                <YAxis tick={{ fill: '#475569', fontSize: 9 }} axisLine={false} domain={[35, 40]} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 12, fontSize: 11 }} />
                <Area type="monotone" dataKey="temperature" stroke="#10b981" fill="url(#tempGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="dark-card-static p-6">
          <h3 className="font-bold text-white text-sm mb-4">📊 Historical Stats Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(stats).map(([key, val]) => (
              <div key={key} className="bg-dark-700/40 rounded-xl p-3 border border-dark-600/30">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</p>
                <p className="text-lg font-bold text-white">{typeof val === 'number' ? val.toFixed(1) : JSON.stringify(val)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="dark-card-static p-6">
          <h3 className="font-bold text-white text-sm mb-3">⚠️ Real-Time Alerts</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 bg-red-500/8 border border-red-500/15 rounded-xl p-3">
                <span className="text-red-400 text-xs mt-0.5">⚠</span>
                <div>
                  <p className="text-xs font-semibold text-red-300">{a.type || 'Alert'}</p>
                  <p className="text-[11px] text-slate-400">{a.message || JSON.stringify(a)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
