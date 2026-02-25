import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import NotificationPanel from '../components/NotificationPanel';
import DiagnosisReport from '../components/DiagnosisReport';

const VITALS_FIELDS = [
  { key: 'heart_rate', label: 'Heart Rate (bpm)', min: 40, max: 200 },
  { key: 'systolic_bp', label: 'Systolic BP', min: 80, max: 200 },
  { key: 'diastolic_bp', label: 'Diastolic BP', min: 40, max: 130 },
  { key: 'temperature', label: 'Temperature (°C)', min: 35, max: 42, step: '0.1' },
  { key: 'spo2', label: 'SpO2 (%)', min: 70, max: 100 },
  { key: 'respiratory_rate', label: 'Respiratory Rate', min: 8, max: 40 },
];

const LABS_FIELDS = [
  { key: 'glucose', label: 'Glucose (mg/dL)', min: 30, max: 500 },
  { key: 'cholesterol', label: 'Cholesterol (mg/dL)', min: 50, max: 400 },
  { key: 'hemoglobin', label: 'Hemoglobin (g/dL)', min: 5, max: 20, step: '0.1' },
  { key: 'wbc', label: 'WBC (×10³/µL)', min: 1, max: 30, step: '0.1' },
  { key: 'creatinine', label: 'Creatinine (mg/dL)', min: 0.1, max: 15, step: '0.1' },
];

const SAMPLE_PROFILES = [
  {
    name: 'Diabetic Risk',
    vitals: { heart_rate: '92', systolic_bp: '148', diastolic_bp: '95', temperature: '37.2', spo2: '96', respiratory_rate: '20' },
    labs: { glucose: '240', cholesterol: '265', hemoglobin: '13.2', wbc: '8.5', creatinine: '1.4' },
    lifestyle: { smoking: true, exercise: 'sedentary', alcohol: 'moderate', sleep_hours: '5', stress_level: 'high' },
  },
  {
    name: 'Healthy Adult',
    vitals: { heart_rate: '68', systolic_bp: '118', diastolic_bp: '76', temperature: '36.6', spo2: '98', respiratory_rate: '16' },
    labs: { glucose: '92', cholesterol: '185', hemoglobin: '14.5', wbc: '6.2', creatinine: '0.9' },
    lifestyle: { smoking: false, exercise: 'active', alcohol: 'none', sleep_hours: '8', stress_level: 'low' },
  },
  {
    name: 'Cardiac Risk',
    vitals: { heart_rate: '105', systolic_bp: '165', diastolic_bp: '100', temperature: '37.0', spo2: '94', respiratory_rate: '22' },
    labs: { glucose: '180', cholesterol: '310', hemoglobin: '12.1', wbc: '10.5', creatinine: '1.8' },
    lifestyle: { smoking: true, exercise: 'sedentary', alcohol: 'heavy', sleep_hours: '4', stress_level: 'high' },
  },
];

const STEPS = ['Vitals', 'Lab Values', 'Lifestyle', 'Results'];

export default function HealthDiagnosis() {
  const [step, setStep] = useState(0);
  const [vitals, setVitals] = useState(Object.fromEntries(VITALS_FIELDS.map((f) => [f.key, ''])));
  const [labs, setLabs] = useState(Object.fromEntries(LABS_FIELDS.map((f) => [f.key, ''])));
  const [lifestyle, setLifestyle] = useState({ smoking: false, exercise: 'moderate', alcohol: 'none', sleep_hours: '7', stress_level: 'moderate' });
  const [result, setResult] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);

  const fillProfile = (p) => {
    setVitals(p.vitals);
    setLabs(p.labs);
    setLifestyle(p.lifestyle);
  };

  const handleOCR = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result;
        const res = await api.post('/ocr/', { image: dataUri, file_type: 'lab_report' });
        const extracted = res.data?.extracted || {};
        if (extracted.glucose) setLabs((p) => ({ ...p, glucose: String(extracted.glucose) }));
        if (extracted.cholesterol) setLabs((p) => ({ ...p, cholesterol: String(extracted.cholesterol) }));
        if (extracted.hemoglobin) setLabs((p) => ({ ...p, hemoglobin: String(extracted.hemoglobin) }));
        if (extracted.wbc) setLabs((p) => ({ ...p, wbc: String(extracted.wbc) }));
        if (extracted.creatinine) setLabs((p) => ({ ...p, creatinine: String(extracted.creatinine) }));
        setOcrLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setOcrLoading(false);
    }
  };

  const handleDiagnose = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        vitals: Object.fromEntries(Object.entries(vitals).map(([k, v]) => [k, parseFloat(v) || 0])),
        labs: Object.fromEntries(Object.entries(labs).map(([k, v]) => [k, parseFloat(v) || 0])),
        lifestyle,
      };
      const res = await api.post('/diagnose', payload);
      setResult(res.data.report || res.data);
      setAlerts(res.data.alerts || []);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Diagnosis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-1">Health Diagnosis Module</p>
        <h1 className="text-2xl font-extrabold text-white">🏥 AI Health Diagnosis</h1>
        <p className="text-slate-400 text-sm mt-1">Comprehensive 6-disease detection with AI-powered analysis</p>
      </motion.div>

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => i <= step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                i === step ? 'bg-accent-cyan/15 text-accent-cyan' :
                i < step ? 'text-accent-cyan/60 hover:text-accent-cyan/80' :
                'text-slate-600'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                i === step ? 'border-accent-cyan bg-accent-cyan/20' :
                i < step ? 'border-accent-cyan/40 bg-accent-cyan/10' :
                'border-dark-500 bg-dark-700'
              }`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-accent-cyan/30' : 'bg-dark-600/50'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Sample profiles */}
      {step < 3 && (
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROFILES.map((p) => (
            <button key={p.name} onClick={() => fillProfile(p)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-dark-700/50 border border-dark-600/40 text-slate-400 hover:text-accent-cyan hover:border-accent-cyan/20 transition-all">
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="vitals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="dark-card-static p-6">
            <h2 className="font-bold text-white text-sm mb-4">Vital Signs</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {VITALS_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                  <input type="number" step={f.step || '1'} min={f.min} max={f.max}
                    value={vitals[f.key]} onChange={(e) => setVitals((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="input-dark text-sm" required />
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="btn-primary mt-5 w-full">Next: Lab Values →</button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="labs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="dark-card-static p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-sm">Lab Values</h2>
              <label className="text-xs font-semibold text-accent-cyan cursor-pointer hover:text-accent-cyan/80 transition-colors">
                {ocrLoading ? 'Scanning…' : '📄 Upload Lab Report (OCR)'}
                <input type="file" accept="image/*" className="hidden" onChange={handleOCR} />
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LABS_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{f.label}</label>
                  <input type="number" step={f.step || '1'} min={f.min} max={f.max}
                    value={labs[f.key]} onChange={(e) => setLabs((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="input-dark text-sm" required />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(0)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(2)} className="btn-primary flex-1">Next: Lifestyle →</button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="life" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="dark-card-static p-6">
            <h2 className="font-bold text-white text-sm mb-4">Lifestyle Factors</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Smoking</label>
                <select value={lifestyle.smoking ? 'yes' : 'no'}
                  onChange={(e) => setLifestyle((p) => ({ ...p, smoking: e.target.value === 'yes' }))}
                  className="input-dark text-sm">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Exercise</label>
                <select value={lifestyle.exercise}
                  onChange={(e) => setLifestyle((p) => ({ ...p, exercise: e.target.value }))}
                  className="input-dark text-sm">
                  <option value="sedentary">Sedentary</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Alcohol</label>
                <select value={lifestyle.alcohol}
                  onChange={(e) => setLifestyle((p) => ({ ...p, alcohol: e.target.value }))}
                  className="input-dark text-sm">
                  <option value="none">None</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Sleep (hrs)</label>
                <input type="number" min="1" max="14" value={lifestyle.sleep_hours}
                  onChange={(e) => setLifestyle((p) => ({ ...p, sleep_hours: e.target.value }))}
                  className="input-dark text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Stress Level</label>
                <select value={lifestyle.stress_level}
                  onChange={(e) => setLifestyle((p) => ({ ...p, stress_level: e.target.value }))}
                  className="input-dark text-sm">
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button onClick={handleDiagnose} disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                {loading ? 'Diagnosing…' : '🏥 Run Diagnosis'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && result && (
          <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            {alerts.length > 0 && <NotificationPanel alerts={alerts} />}
            <DiagnosisReport report={result} />
            <button onClick={() => { setStep(0); setResult(null); setAlerts([]); }}
              className="btn-secondary w-full">
              ← Start New Diagnosis
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
