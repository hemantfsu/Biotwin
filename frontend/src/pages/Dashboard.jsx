import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const CARDS = [
  { to: '/predict/lab', icon: '🧪', title: 'Lab Analysis', desc: 'AI cardiac risk from blood work', gradient: 'from-rose-500 to-pink-600', shadow: 'shadow-rose-500/20', bg: 'bg-rose-50' },
  { to: '/predict/wearable', icon: '📱', title: 'Wearable AI', desc: 'LSTM time-series forecasting', gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20', bg: 'bg-blue-50' },
  { to: '/predict/xray', icon: '🩻', title: 'X-Ray CNN', desc: 'Chest screening with GradCAM', gradient: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20', bg: 'bg-emerald-50' },
  { to: '/diagnose', icon: '🏥', title: 'Health Diagnosis', desc: '6-disease detection engine', gradient: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20', bg: 'bg-violet-50' },
  { to: '/live', icon: '⌚', title: 'Live Vitals', desc: 'Real-time smartwatch monitor', gradient: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20', bg: 'bg-amber-50' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/vitals/stats').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-purple-600 to-brand-700 p-8 md:p-10 text-white"
      >
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-10 right-20 w-20 h-20 bg-white/10 rounded-2xl rotate-12 animate-float" />
        <div className="absolute bottom-6 right-32 w-12 h-12 bg-white/10 rounded-xl -rotate-12 animate-float-delay" />

        <div className="relative z-10">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm font-medium mb-1"
          >
            {greeting()} 👋
          </motion.p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {user?.name || 'User'}
          </h1>
          <p className="mt-2 text-white/70 text-sm max-w-lg">
            Your BioTwin AI digital health dashboard — multi-modal early disease detection at your fingertips.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Role</p>
              <p className="text-sm font-bold capitalize">{user?.role || 'Patient'}</p>
            </div>
            {stats && stats.count > 0 && (
              <>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                  <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Readings</p>
                  <p className="text-sm font-bold">{stats.count} today</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                  <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Avg Heart Rate</p>
                  <p className="text-sm font-bold">{stats.avgHR || '--'} bpm</p>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* AI Modules */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">AI Modules</h2>
            <p className="text-sm text-slate-400 mt-0.5">Select a module to analyze your health data</p>
          </div>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {CARDS.map((c) => (
            <motion.div key={c.to} variants={item}>
              <Link
                to={c.to}
                className="group relative block glass-card p-6 overflow-hidden"
              >
                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />

                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {c.icon}
                  </div>
                  <h3 className="font-bold text-slate-800 text-base group-hover:text-brand-600 transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">{c.desc}</p>

                  <div className="mt-4 flex items-center text-xs font-semibold text-brand-500 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                    Open module →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
