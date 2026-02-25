import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const FIELDS = [
  { key: 'age', label: 'Age', type: 'number', placeholder: '63' },
  { key: 'sex', label: 'Sex (1=M, 0=F)', type: 'number', placeholder: '1' },
  { key: 'cp', label: 'Chest Pain (0-3)', type: 'number', placeholder: '3' },
  { key: 'trestbps', label: 'Resting BP', type: 'number', placeholder: '145' },
  { key: 'chol', label: 'Cholesterol', type: 'number', placeholder: '233' },
  { key: 'fbs', label: 'FBS > 120 (1/0)', type: 'number', placeholder: '1' },
  { key: 'restecg', label: 'Rest ECG (0-2)', type: 'number', placeholder: '0' },
  { key: 'thalach', label: 'Max Heart Rate', type: 'number', placeholder: '150' },
  { key: 'exang', label: 'Exer. Angina (1/0)', type: 'number', placeholder: '0' },
  { key: 'oldpeak', label: 'ST Depression', type: 'number', placeholder: '2.3', step: '0.1' },
  { key: 'slope', label: 'Slope (0-2)', type: 'number', placeholder: '0' },
  { key: 'ca', label: 'Major Vessels (0-3)', type: 'number', placeholder: '0' },
  { key: 'thal', label: 'Thalassemia (0-3)', type: 'number', placeholder: '1' },
];

const SAMPLE = { age: 63, sex: 1, cp: 3, trestbps: 145, chol: 233, fbs: 1, restecg: 0, thalach: 150, exang: 0, oldpeak: 2.3, slope: 0, ca: 0, thal: 1 };

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload;
    return (
      <div className="glass-card-static px-3 py-2 text-xs">
        <p className="font-semibold text-slate-700">{d.name}</p>
        <p className={d.raw > 0 ? 'text-red-500' : 'text-blue-500'}>
          Impact: {d.raw > 0 ? '+' : ''}{d.raw?.toFixed(3)}
        </p>
      </div>
    );
  }
  return null;
};

export default function LabPrediction() {
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {};
      FIELDS.forEach((f) => { payload[f.key] = Number(form[f.key]); });
      const res = await api.post('/predict/lab', payload);
      const record = res.data.data;
      setResult({
        risk_percent: (record.prediction.riskScore * 100),
        risk_label: record.prediction.riskLevel,
        confidence: record.prediction.confidence,
        shap_values: record.explanation,
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed');
    }
    setLoading(false);
  };

  const shapData = result?.shap_values
    ? Object.entries(result.shap_values)
        .map(([name, value]) => ({ name, value: Math.abs(value), raw: value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    : [];

  const riskColor = result?.risk_percent > 60 ? '#ef4444' : result?.risk_percent > 30 ? '#f59e0b' : '#10b981';
  const riskBg = result?.risk_percent > 60 ? 'from-red-50 to-rose-50 border-red-200' : result?.risk_percent > 30 ? 'from-amber-50 to-yellow-50 border-amber-200' : 'from-emerald-50 to-green-50 border-green-200';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-xl">🧪</div>
          <div>
            <h1 className="page-title">Lab Report Analysis</h1>
            <p className="page-subtitle">Gradient Boosting + SHAP explainability</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="glass-card-static p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-slate-800 text-sm">Patient Data</h2>
            <button
              onClick={() => setForm(SAMPLE)}
              className="text-xs font-semibold text-brand-500 hover:text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition"
            >
              ✨ Fill sample
            </button>
          </div>

          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="group">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{f.label}</label>
                <input
                  type={f.type}
                  step={f.step || '1'}
                  required
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="input-modern mt-1 !py-2.5 !text-sm"
                />
              </div>
            ))}
            <div className="col-span-2 mt-2">
              <button type="submit" disabled={loading} className="btn-danger w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing…
                  </span>
                ) : '🔬 Analyze Lab Report'}
              </button>
            </div>
          </form>
          {error && <p className="text-red-500 text-sm mt-3 font-medium">{error}</p>}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Risk Score */}
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${riskBg} border p-6 text-center`}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: riskColor }} />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Cardiac Risk</p>
                <p className="text-6xl font-black mt-3 tabular-nums" style={{ color: riskColor }}>
                  {result.risk_percent?.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-500 mt-2 capitalize font-medium">{result.risk_label}</p>
              </div>

              {/* SHAP Chart */}
              {shapData.length > 0 && (
                <div className="glass-card-static p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm">🔍</span>
                    <h3 className="text-sm font-bold text-slate-700">SHAP Feature Importance</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={shapData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} width={85} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                        {shapData.map((d, i) => (
                          <Cell key={i} fill={d.raw > 0 ? '#ef4444' : '#3b82f6'} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Increases risk</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Decreases risk</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
