import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WearablePrediction() {
  const [jsonInput, setJsonInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSample = () => {
    const data = Array.from({ length: 24 }, (_, i) => ({
      heart_rate: 65 + Math.floor(Math.random() * 30),
      spo2: 94 + Math.floor(Math.random() * 6),
      steps: Math.floor(Math.random() * 500),
    }));
    setJsonInput(JSON.stringify(data, null, 2));
  };

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await api.post('/predict/wearable', { readings: parsed });
      const record = res.data.data;
      setResult({
        risk_percent: (record.prediction.riskScore * 100),
        risk_label: record.prediction.riskLevel,
        confidence: record.prediction.confidence,
        trend_analysis: record.explanation?.risk_trend || {},
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Prediction failed');
    }
    setLoading(false);
  };

  const chartData = result?.trend_analysis
    ? Object.entries(result.trend_analysis).map(([name, val]) => ({
        name: name.replace(/_/g, ' '),
        value: typeof val === 'number' ? val : 0,
      }))
    : [];

  const riskColor = result?.risk_percent > 60 ? '#ef4444' : result?.risk_percent > 30 ? '#f59e0b' : '#10b981';
  const riskBg = result?.risk_percent > 60 ? 'from-red-50 to-rose-50 border-red-200' : result?.risk_percent > 30 ? 'from-amber-50 to-yellow-50 border-amber-200' : 'from-emerald-50 to-green-50 border-green-200';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">📱</div>
        <div>
          <h1 className="page-title">Wearable Prediction</h1>
          <p className="page-subtitle">Bidirectional LSTM time-series health risk forecasting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="glass-card-static p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 text-sm">Sensor Data (24 timesteps)</h2>
            <button onClick={generateSample} className="text-xs font-semibold text-brand-500 hover:text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition">
              ✨ Generate sample
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={14}
            className="w-full text-xs font-mono bg-slate-900/95 text-emerald-300 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-brand-400/40 focus:outline-none resize-none leading-relaxed"
            placeholder='[{"heart_rate":72,"spo2":98,"steps":150}, ...]'
          />
          <button
            onClick={submit}
            disabled={loading || !jsonInput.trim()}
            className="w-full mt-4 btn-primary !bg-gradient-to-r !from-blue-500 !to-cyan-500 !shadow-blue-500/25 hover:!shadow-blue-500/40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Predicting…
              </span>
            ) : '📊 Predict Health Risk'}
          </button>
          {error && <p className="text-red-500 text-sm mt-3 font-medium">{error}</p>}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${riskBg} border p-6 text-center`}>
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: riskColor }} />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Health Risk Score</p>
                <p className="text-6xl font-black mt-3 tabular-nums" style={{ color: riskColor }}>
                  {result.risk_percent?.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-500 mt-2 capitalize font-medium">{result.risk_label}</p>
              </div>

              {chartData.length > 0 && (
                <div className="glass-card-static p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm">📈</span>
                    <h3 className="text-sm font-bold text-slate-700">Trend Analysis</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
