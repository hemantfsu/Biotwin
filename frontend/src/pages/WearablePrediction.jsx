import React, { useState } from 'react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WearablePrediction() {
  const [jsonInput, setJsonInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateSample = () => {
    const data = Array.from({ length: 24 }, (_, i) => ({
      heartRate: 65 + Math.floor(Math.random() * 30),
      spo2: 94 + Math.floor(Math.random() * 6),
      systolicBP: 110 + Math.floor(Math.random() * 30),
      diastolicBP: 70 + Math.floor(Math.random() * 15),
      temperature: +(97 + Math.random() * 2.5).toFixed(1),
      respiratoryRate: 12 + Math.floor(Math.random() * 8),
    }));
    setJsonInput(JSON.stringify(data, null, 2));
  };

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const parsed = JSON.parse(jsonInput);
      const res = await api.post('/predict/wearable', { sequence: parsed });
      setResult(res.data);
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📱 Wearable Prediction</h1>
        <p className="text-gray-500 mt-1">Bidirectional LSTM time-series health risk forecasting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">Sensor Data (24 timesteps)</h2>
            <button onClick={generateSample} className="text-xs text-indigo-600 hover:underline">
              Generate sample
            </button>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={14}
            className="w-full text-xs font-mono border rounded-xl p-3 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            placeholder='[{"heartRate":72,"spo2":98,...}, ...]'
          />
          <button
            onClick={submit}
            disabled={loading || !jsonInput.trim()}
            className="w-full mt-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
          >
            {loading ? 'Predicting…' : '📊 Predict Health Risk'}
          </button>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        {result && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-6 text-center border ${
              result.risk_percent > 60
                ? 'bg-red-50 border-red-200'
                : result.risk_percent > 30
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <p className="text-sm font-medium text-gray-600">Health Risk Score</p>
              <p className={`text-5xl font-black mt-2 ${
                result.risk_percent > 60 ? 'text-red-600' : result.risk_percent > 30 ? 'text-amber-500' : 'text-green-600'
              }`}>
                {result.risk_percent?.toFixed(1)}%
              </p>
              <p className="text-gray-500 mt-1 capitalize">{result.risk_label}</p>
            </div>

            {chartData.length > 0 && (
              <div className="bg-white rounded-2xl border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📈 Trend Analysis</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
