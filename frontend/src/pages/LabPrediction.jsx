import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';

const FIELDS = [
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'sex', label: 'Sex (0=F,1=M)', type: 'number' },
  { key: 'cp', label: 'Chest Pain (0-3)', type: 'number' },
  { key: 'trestbps', label: 'Resting BP', type: 'number' },
  { key: 'chol', label: 'Cholesterol', type: 'number' },
  { key: 'fbs', label: 'Fasting BS>120 (0/1)', type: 'number' },
  { key: 'restecg', label: 'Rest ECG (0-2)', type: 'number' },
  { key: 'thalach', label: 'Max Heart Rate', type: 'number' },
  { key: 'exang', label: 'Exercise Angina (0/1)', type: 'number' },
  { key: 'oldpeak', label: 'ST Depression', type: 'number', step: '0.1' },
  { key: 'slope', label: 'ST Slope (0-2)', type: 'number' },
  { key: 'ca', label: 'Major Vessels (0-4)', type: 'number' },
  { key: 'thal', label: 'Thalassemia (0-3)', type: 'number' },
];

const SAMPLE = { age: '54', sex: '1', cp: '0', trestbps: '122', chol: '286', fbs: '0', restecg: '0', thalach: '116', exang: '1', oldpeak: '3.2', slope: '1', ca: '2', thal: '2' };

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-500 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-white mb-1">{d.feature}</p>
      <p style={{ color: d.value >= 0 ? '#ef4444' : '#3b82f6' }}>
        {d.value >= 0 ? '↑ Increases' : '↓ Decreases'} risk by {Math.abs(d.value).toFixed(4)}
      </p>
    </div>
  );
};

export default function LabPrediction() {
  const [form, setForm] = useState(Object.fromEntries(FIELDS.map((f) => [f.key, ''])));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const fillSample = () => setForm({ ...SAMPLE });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {};
      FIELDS.forEach((f) => {
        payload[f.key] = parseFloat(form[f.key]) || 0;
      });
      const res = await api.post('/predict/lab', payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const shapData = result?.shap_values
    ? Object.entries(result.shap_values)
        .map(([feature, value]) => ({ feature, value: +value }))
        .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-1">Lab Analysis Module</p>
        <h1 className="text-2xl font-extrabold text-white">🧪 Cardiac Risk Prediction</h1>
        <p className="text-slate-400 text-sm mt-1">XGBoost model with SHAP explainability analysis</p>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="dark-card-static p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white text-sm">Patient Lab Values</h2>
          <button onClick={fillSample} type="button"
            className="text-xs font-semibold text-accent-cyan hover:text-accent-cyan/80 transition-colors">
            Fill Sample Data
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                <input
                  type="number"
                  step={f.step || '1'}
                  value={form[f.key]}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  required
                  className="input-dark text-sm"
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-5 w-full disabled:opacity-50">
            {loading ? 'Analyzing…' : 'Run Cardiac Risk Analysis'}
          </button>
        </form>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            {/* Risk Card */}
            <div className={`dark-card-static p-6 border-l-4 ${
              result.risk_percent >= 50 ? 'border-l-red-500' : 'border-l-emerald-500'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Risk Assessment</p>
                  <h3 className="text-3xl font-black" style={{ color: result.risk_percent >= 50 ? '#ef4444' : '#10b981' }}>
                    {result.risk_percent?.toFixed(1)}%
                  </h3>
                  <p className="text-sm font-semibold mt-1" style={{ color: result.risk_percent >= 50 ? '#ef4444' : '#10b981' }}>
                    {result.risk_label}
                  </p>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4 md:text-right">
                  <p className="text-xs text-slate-500 mb-1">Model Confidence</p>
                  <p className="text-2xl font-bold text-white">{(result.confidence * 100)?.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* SHAP Chart */}
            {shapData.length > 0 && (
              <div className="dark-card-static p-6">
                <h3 className="font-bold text-white text-sm mb-1">SHAP Feature Impact</h3>
                <p className="text-xs text-slate-500 mb-4">How each feature influences the prediction</p>
                <ResponsiveContainer width="100%" height={shapData.length * 36 + 20}>
                  <BarChart data={shapData} layout="vertical" margin={{ left: 100, right: 20, top: 5, bottom: 5 }}>
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="feature" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={95} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13,242,188,0.04)' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {shapData.map((d, i) => (
                        <Cell key={i} fill={d.value >= 0 ? '#ef4444' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-3 text-[10px] font-semibold">
                  <span className="text-red-400">● Increases risk</span>
                  <span className="text-blue-400">● Decreases risk</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
