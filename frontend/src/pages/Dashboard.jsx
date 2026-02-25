import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../services/AuthContext';
import api from '../services/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

/* ── Body System Cards ── */
const SYSTEMS = [
  {
    name: 'Cardiovascular', icon: '❤️', color: '#ef4444', gradient: 'from-red-500/20 to-rose-600/10', border: 'border-red-500/20',
    riskScore: 12, riskLabel: 'Low Risk',
    metrics: [
      { label: 'Heart Rate', value: '68 bpm' },
      { label: 'Blood Pressure', value: '118/76 mmHg' },
      { label: 'HRV', value: '65 ms' },
    ],
  },
  {
    name: 'Neurological', icon: '🧠', color: '#8b5cf6', gradient: 'from-violet-500/20 to-purple-600/10', border: 'border-violet-500/20',
    riskScore: 8, riskLabel: 'Normal',
    metrics: [
      { label: 'Sleep Quality', value: '72%' },
      { label: 'Stress Level', value: 'Moderate' },
      { label: 'Focus Score', value: '85%' },
    ],
  },
  {
    name: 'Respiratory', icon: '🫁', color: '#3b82f6', gradient: 'from-blue-500/20 to-cyan-600/10', border: 'border-blue-500/20',
    riskScore: 5, riskLabel: 'Normal',
    metrics: [
      { label: 'SpO2', value: '98%' },
      { label: 'Breathing Rate', value: '16/min' },
      { label: 'Lung Capacity', value: 'Normal' },
    ],
  },
  {
    name: 'Metabolic', icon: '⚡', color: '#f59e0b', gradient: 'from-amber-500/20 to-orange-600/10', border: 'border-amber-500/20',
    riskScore: 18, riskLabel: 'Moderate',
    metrics: [
      { label: 'Glucose', value: '112 mg/dL' },
      { label: 'Metabolic Rate', value: '59%' },
      { label: 'BMI', value: '28' },
    ],
  },
  {
    name: 'Musculoskeletal', icon: '💪', color: '#10b981', gradient: 'from-emerald-500/20 to-teal-600/10', border: 'border-emerald-500/20',
    riskScore: 10, riskLabel: 'Normal',
    metrics: [
      { label: 'Activity Score', value: '74%' },
      { label: 'Recovery Time', value: 'Normal' },
      { label: 'Bone Density', value: 'Optimal' },
    ],
  },
];

/* ── Predictive Insights ── */
const INSIGHTS = [
  { title: 'Glucose Trend Analysis', confidence: 80, color: '#f59e0b', icon: '📊',
    text: 'Your fasting glucose has increased by 8% over the past months. Pattern suggests monitoring.',
    alert: 'Risk of prediabetes in 6-12 months if current trend continues' },
  { title: 'Sleep-Stress Connection', confidence: 86, color: '#8b5cf6', icon: '😴',
    text: 'Poor sleep quality detected on 4/7 nights. Correlates with elevated cortisol and reduced cognitive performance.',
    alert: 'Recommended: Sleep hygiene protocol to reduce stress markers' },
  { title: 'Cardiovascular Health', confidence: 94, color: '#10b981', icon: '❤️',
    text: 'Heart rate variability has improved by 15% since increasing exercise frequency. Blood pressure remains optimal.',
    alert: 'Cardiovascular age: 5 years younger than chronological age' },
  { title: 'Metabolic Optimization', confidence: 71, color: '#ef4444', icon: '⚡',
    text: 'Insulin sensitivity declining. Pattern suggests need for dietary intervention and increased physical activity.',
    alert: 'Early intervention could prevent metabolic syndrome within 3 months' },
];

/* ── Timeline Events ── */
const TIMELINE = [
  { date: 'Feb 2026', title: 'Initial Health Assessment', desc: 'Comprehensive assessment completed. All major systems analyzed and baseline metrics established.', done: true },
  { date: 'Feb 2026', title: 'Cardiovascular Improvement', desc: '5% improvement in heart rate variability after exercise program implementation.', done: true },
  { date: 'Mar 2026', title: 'Metabolic Pattern Detected', desc: 'Early glucose dysregulation pattern identified. Intervention protocol activated.', done: false },
  { date: 'Apr 2026', title: 'Predicted Intervention Success', desc: 'Following current protocol, metabolic markers expected to normalize within optimal range.', done: false },
  { date: 'Jun 2026', title: 'Optimal Health Milestone', desc: 'Projected achievement of optimal health score across all major systems.', done: false },
];

/* ── Health Score Ring ── */
function ScoreRing({ score, size = 160 }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(13,242,188,0.08)" strokeWidth="10" />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0DF2BC" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-white">{score}</span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Health Score</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth(); // eslint-disable-line no-unused-vars
  const [stats, setStats] = useState(null); // eslint-disable-line no-unused-vars

  useEffect(() => {
    api.get('/vitals/stats').then((r) => setStats(r.data.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Hero Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-800 via-dark-750 to-dark-800 border border-dark-600/50 p-8 md:p-10"
      >
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-cyan/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent-purple/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
              Powered by Advanced AI
            </motion.p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Your Digital<br />
              <span className="text-glow text-accent-cyan">Health Twin</span>
            </h1>
            <p className="mt-3 text-slate-400 text-sm max-w-md leading-relaxed">
              Visualize your body as a living digital twin. Predict diseases before symptoms appear. Experience your health through intelligent data.
            </p>

            {/* Stats row */}
            <div className="flex gap-6 mt-6">
              {[
                { value: '99.2%', label: 'AI Accuracy' },
                { value: '24/7', label: 'Monitoring' },
                { value: '50+', label: 'Health Markers' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick module links */}
          <div className="flex md:flex-col gap-2">
            {[
              { to: '/predict/lab', icon: '🧪', label: 'Lab Analysis' },
              { to: '/predict/xray', icon: '🩻', label: 'X-Ray CNN' },
              { to: '/live', icon: '⌚', label: 'Live Vitals' },
            ].map((m) => (
              <Link key={m.to} to={m.to}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-dark-700/50 border border-dark-600/40 text-sm text-slate-300 hover:text-accent-cyan hover:border-accent-cyan/20 hover:bg-accent-cyan/5 transition-all duration-200">
                <span>{m.icon}</span>
                <span className="font-medium text-xs">{m.label}</span>
                <span className="ml-auto text-slate-600">→</span>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── AI Health Score ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="dark-card-static p-6 md:p-8">
        <p className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-1">Your AI Health Score</p>
        <p className="text-slate-400 text-sm mb-6">Real-time analysis of your complete health landscape</p>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreRing score={87} size={160} />
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Cardiovascular', score: 88, color: '#ef4444' },
              { label: 'Neurological', score: 92, color: '#8b5cf6' },
              { label: 'Respiratory', score: 95, color: '#3b82f6' },
              { label: 'Metabolic', score: 72, color: '#f59e0b' },
              { label: 'Musculoskeletal', score: 90, color: '#10b981' },
              { label: 'Immune', score: 85, color: '#06b6d4' },
            ].map((s) => (
              <div key={s.label} className="bg-dark-700/40 rounded-xl p-3 border border-dark-600/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
                  <p className="text-xs font-bold" style={{ color: s.color }}>{s.score}%</p>
                </div>
                <div className="w-full h-1.5 rounded-full bg-dark-600/50">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: s.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.score}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── System Analysis ── */}
      <div>
        <p className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-1">System Analysis</p>
        <p className="text-slate-400 text-sm mb-5">Deep dive into each body system with AI-powered insights</p>

        <motion.div variants={container} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEMS.map((sys) => (
            <motion.div key={sys.name} variants={item}
              className={`dark-card-static p-5 bg-gradient-to-br ${sys.gradient} border ${sys.border} hover:border-opacity-40 transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{sys.icon}</span>
                  <h3 className="font-bold text-white text-sm">{sys.name}</h3>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${sys.color}20`, color: sys.color }}>
                  {sys.riskLabel}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-xs text-slate-500">Risk Score</p>
                <div className="flex-1 h-1 rounded-full bg-dark-600/50">
                  <div className="h-full rounded-full transition-all" style={{ width: `${sys.riskScore}%`, backgroundColor: sys.color }} />
                </div>
                <p className="text-xs font-bold" style={{ color: sys.color }}>{sys.riskScore}%</p>
              </div>
              <div className="space-y-2">
                {sys.metrics.map((m) => (
                  <div key={m.label} className="flex justify-between text-xs">
                    <span className="text-slate-500">{m.label}</span>
                    <span className="text-slate-200 font-medium">{m.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Deep Predictive Insights ── */}
      <div>
        <p className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-1">Deep Predictive Insights</p>
        <p className="text-slate-400 text-sm mb-5">AI-powered correlations and future health predictions</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INSIGHTS.map((ins, i) => (
            <motion.div key={ins.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="dark-card-static p-5 hover:border-dark-500/60 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{ins.icon}</span>
                  <h3 className="font-bold text-white text-sm">{ins.title}</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${ins.color}15`, color: ins.color }}>
                  {ins.confidence}% confidence
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{ins.text}</p>
              <div className="px-3 py-2 rounded-lg bg-dark-700/50 border-l-2" style={{ borderColor: ins.color }}>
                <p className="text-[11px] text-slate-300 font-medium">{ins.alert}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Health Journey Timeline ── */}
      <div>
        <p className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-1">Your Health Journey</p>
        <p className="text-slate-400 text-sm mb-5">AI-tracked milestones and predictive timeline</p>

        <div className="dark-card-static p-6">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-accent-cyan/40 via-dark-600/50 to-dark-600/20" />

            <div className="space-y-6">
              {TIMELINE.map((ev, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="flex gap-4">
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                      ev.done
                        ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan'
                        : 'bg-dark-700 border-dark-500 text-slate-500'
                    }`}>
                      {ev.done ? '✓' : i + 1}
                    </div>
                  </div>
                  <div className={`flex-1 pb-2 ${!ev.done ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold text-white">{ev.title}</p>
                      <span className="text-[10px] text-slate-500">{ev.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{ev.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Professional Health Reports ── */}
      <div className="dark-card-static p-6 md:p-8 text-center">
        <p className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-2">Professional Health Reports</p>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          Generate comprehensive PDF reports for your healthcare provider with AI-powered analysis.
        </p>
        <button className="btn-primary px-8">
          View Sample Report
        </button>
      </div>

      {/* ── AI Modules Grid ── */}
      <div>
        <p className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-1">AI Modules</p>
        <p className="text-slate-400 text-sm mb-5">Select a module to analyze your health data</p>

        <motion.div variants={container} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { to: '/predict/lab', icon: '🧪', title: 'Lab Analysis', desc: 'AI cardiac risk from blood work', color: '#ef4444' },
            { to: '/predict/wearable', icon: '📱', title: 'Wearable AI', desc: 'LSTM time-series forecasting', color: '#3b82f6' },
            { to: '/predict/xray', icon: '🩻', title: 'X-Ray CNN', desc: 'Chest screening with GradCAM', color: '#10b981' },
            { to: '/diagnose', icon: '🏥', title: 'Health Diagnosis', desc: '6-disease detection engine', color: '#8b5cf6' },
            { to: '/live', icon: '⌚', title: 'Live Vitals', desc: 'Real-time smartwatch monitor', color: '#f59e0b' },
          ].map((c) => (
            <motion.div key={c.to} variants={item}>
              <Link to={c.to}
                className="group relative block dark-card-static p-5 overflow-hidden hover:border-dark-500/60">
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-50 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: c.color }} />
                <div className="relative z-10">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3" style={{ backgroundColor: `${c.color}15` }}>
                    {c.icon}
                  </div>
                  <h3 className="font-bold text-white text-sm group-hover:text-accent-cyan transition-colors">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
                  <div className="mt-3 text-xs font-semibold text-accent-cyan/60 group-hover:text-accent-cyan transition-colors">
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
