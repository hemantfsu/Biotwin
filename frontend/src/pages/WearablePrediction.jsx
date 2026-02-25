import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../services/api';

function generateSample() {
  const steps = 24;
  const data = [];
  for (let i = 0; i < steps; i++) {
    data.push({
      heart_rate: +(65 + Math.random() * 30).toFixed(1),
      spo2: +(95 + Math.random() * 4).toFixed(1),
      systolic_bp: +(110 + Math.random() * 30).toFixed(1),
      diastolic_bp: +(65 + Math.random() * 20).toFixed(1),
      temperature: +(36.2 + Math.random() * 1.5).toFixed(1),
      respiratory_rate: +(14 + Math.random() * 8).toFixed(1),
    });
  }
  return data;
}

export default function WearablePrediction() {
  const [jsonText, setJsonText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSample = () => {
    const sample = generateSample();
    setJsonText(JSON.stringify(sample, null, 2));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const readings = JSON.parse(jsonText);
      const res = await api.post('/predict/wearable', { readings });
      setResult(res.data);
    } catch (err) {
      if (err instanceof SyntaxError) setError('Invalid JSON format');
      else setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const trendData = result?.trend_analysis
    ? result.trend_analysis.map((t, i) => ({ step: i + 1, ...t }))
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-1">Wearable AI Module</p>
        <h1 className="text-2xl font-extrabold text-white">📱 Wearable LSTM Prediction</h1>
        <p className="text-slate-400 text-sm mt-1">Time-series deep learning with 24-step sensor data</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="dark-card-static p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-sm">Sensor Readings (JSON)</h2>
          <button onClick={handleSample} type="button"
            className="text-xs font-semibold text-accent-cyan hover:text-accent-cyan/80 transition-colors">
            Generate 24-Step Sample
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            rows={12}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='[{"heart_rate":72,"spo2":98,"systolic_bp":120,"diastolic_bp":80,"temperature":36.6,"respiratory_rate":16}, ...]'
            className="input-dark font-mono text-xs leading-relaxed resize-y"
            required
          />
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}
          <button type="submit" disabled={loading} className="btn-primary mt-4 w-full disabled:opacity-50">
            {loading ? 'Processing…' : 'Run LSTM Analysis'}
          </button>
        </form>
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            <div className={`dark-card-static p-6 border-l-4 ${
              result.risk_percent >= 50 ? 'border-l-red-500' : 'border-l-emerald-500'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Health Risk</p>
                  <h3 className="text-3xl font-black" style={{ color: result.risk_percent >= 50 ? '#ef4444' : '#10b981' }}>
                    {result.risk_percent?.toFixed(1)}%
                  </h3>
                  <p className="text-sm font-semibold mt-1" style={{ color: result.risk_percent >= 50 ? '#ef4444' : '#10b981' }}>
                    {result.risk_label}
                  </p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4 md:text-right">
                  <p className="text-xs text-slate-500 mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-white">{(result.confidence * 100)?.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {trendData.length > 0 && (
              <div className="dark-card-static p-6">
                <h3 className="font-bold text-white text-sm mb-1">Trend Analysis</h3>
                <p className="text-xs text-slate-500 mb-4">Vital sign trends over the 24-step window</p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.1)" />
                    <XAxis dataKey="step" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1d2e', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 12, fontSize: 11 }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line type="monotone" dataKey="heart_rate" stroke="#ef4444" strokeWidth={2} dot={false} name="Heart Rate" />
                    <Line type="monotone" dataKey="spo2" stroke="#3b82f6" strokeWidth={2} dot={false} name="SpO2" />
                    <Line type="monotone" dataKey="systolic_bp" stroke="#f59e0b" strokeWidth={2} dot={false} name="Systolic BP" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
