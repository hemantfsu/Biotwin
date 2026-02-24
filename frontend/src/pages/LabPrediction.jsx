import React, { useState } from 'react';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const FIELDS = [
  { key: 'age', label: 'Age', type: 'number', placeholder: '63' },
  { key: 'sex', label: 'Sex (1=M, 0=F)', type: 'number', placeholder: '1' },
  { key: 'cp', label: 'Chest Pain Type (0-3)', type: 'number', placeholder: '3' },
  { key: 'trestbps', label: 'Resting BP (mmHg)', type: 'number', placeholder: '145' },
  { key: 'chol', label: 'Cholesterol (mg/dL)', type: 'number', placeholder: '233' },
  { key: 'fbs', label: 'Fasting Blood Sugar > 120 (1/0)', type: 'number', placeholder: '1' },
  { key: 'restecg', label: 'Rest ECG (0-2)', type: 'number', placeholder: '0' },
  { key: 'thalach', label: 'Max Heart Rate', type: 'number', placeholder: '150' },
  { key: 'exang', label: 'Exercise Angina (1/0)', type: 'number', placeholder: '0' },
  { key: 'oldpeak', label: 'ST Depression', type: 'number', placeholder: '2.3', step: '0.1' },
  { key: 'slope', label: 'Slope (0-2)', type: 'number', placeholder: '0' },
  { key: 'ca', label: 'Major Vessels (0-3)', type: 'number', placeholder: '0' },
  { key: 'thal', label: 'Thalassemia (0-3)', type: 'number', placeholder: '1' },
];

const SAMPLE = { age: 63, sex: 1, cp: 3, trestbps: 145, chol: 233, fbs: 1, restecg: 0, thalach: 150, exang: 0, oldpeak: 2.3, slope: 0, ca: 0, thal: 1 };

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
      setResult(res.data);
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🧪 Lab Report Analysis</h1>
        <p className="text-gray-500 mt-1">AI-powered cardiac risk prediction using Gradient Boosting + SHAP</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Patient Data</h2>
            <button
              onClick={() => setForm(SAMPLE)}
              className="text-xs text-indigo-600 hover:underline"
            >
              Fill sample data
            </button>
          </div>

          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 font-medium">{f.label}</label>
                <input
                  type={f.type}
                  step={f.step || '1'}
                  required
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                />
              </div>
            ))}
            <div className="col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 disabled:opacity-50"
              >
                {loading ? 'Analyzing…' : '🔬 Analyze Lab Report'}
              </button>
            </div>
          </form>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-6 text-center border ${
              result.risk_percent > 60
                ? 'bg-red-50 border-red-200'
                : result.risk_percent > 30
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <p className="text-sm font-medium text-gray-600">Cardiac Risk</p>
              <p className={`text-5xl font-black mt-2 ${
                result.risk_percent > 60 ? 'text-red-600' : result.risk_percent > 30 ? 'text-amber-500' : 'text-green-600'
              }`}>
                {result.risk_percent?.toFixed(1)}%
              </p>
              <p className="text-gray-500 mt-1 capitalize">{result.risk_label}</p>
            </div>

            {shapData.length > 0 && (
              <div className="bg-white rounded-2xl border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🔍 SHAP Feature Importance</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={shapData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {shapData.map((d, i) => (
                        <Cell key={i} fill={d.raw > 0 ? '#ef4444' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-400 mt-2">🔴 Increases risk &nbsp; 🔵 Decreases risk</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
