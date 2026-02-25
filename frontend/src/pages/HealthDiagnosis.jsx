import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import NotificationPanel from '../components/NotificationPanel';
import DiagnosisReport from '../components/DiagnosisReport';

const SAMPLE_PROFILES = [
  { label: '🫀 Cardiac Risk', vitals: { heartRate: 105, systolicBP: 165, diastolicBP: 100, spo2: 93, temperature: 99.2, respiratoryRate: 22 }, labs: { cholesterol: 280, bloodGlucose: 145, hemoglobin: 13.5, wbc: 8000, platelets: 250000 } },
  { label: '🫁 Respiratory', vitals: { heartRate: 92, systolicBP: 125, diastolicBP: 82, spo2: 88, temperature: 101.5, respiratoryRate: 28 }, labs: { cholesterol: 200, bloodGlucose: 110, hemoglobin: 12.0, wbc: 15000, platelets: 180000 } },
  { label: '✅ Healthy', vitals: { heartRate: 72, systolicBP: 118, diastolicBP: 76, spo2: 98, temperature: 98.4, respiratoryRate: 16 }, labs: { cholesterol: 185, bloodGlucose: 92, hemoglobin: 14.5, wbc: 7000, platelets: 250000 } },
];

const VITALS_FIELDS = [
  { key: 'heartRate', label: 'Heart Rate (bpm)', ph: '72' },
  { key: 'systolicBP', label: 'Systolic BP (mmHg)', ph: '120' },
  { key: 'diastolicBP', label: 'Diastolic BP (mmHg)', ph: '80' },
  { key: 'spo2', label: 'SpO2 (%)', ph: '98' },
  { key: 'temperature', label: 'Temperature (°F)', ph: '98.6' },
  { key: 'respiratoryRate', label: 'Resp Rate (/min)', ph: '16' },
];

const LABS_FIELDS = [
  { key: 'cholesterol', label: 'Cholesterol (mg/dL)', ph: '200' },
  { key: 'bloodGlucose', label: 'Blood Glucose (mg/dL)', ph: '100' },
  { key: 'hemoglobin', label: 'Hemoglobin (g/dL)', ph: '14' },
  { key: 'wbc', label: 'WBC (cells/µL)', ph: '7000' },
  { key: 'platelets', label: 'Platelets (/µL)', ph: '250000' },
];

const steps = ['Vitals', 'Lab Values', 'Lifestyle', 'Results'];

export default function HealthDiagnosis() {
  const [step, setStep] = useState(1);
  const [vitals, setVitals] = useState({});
  const [labs, setLabs] = useState({});
  const [lifestyle, setLifestyle] = useState({ smoking: false, exercise: 'moderate', age: '', sex: 'male' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const fileRef = useRef();

  const applySample = (p) => { setVitals(p.vitals); setLabs(p.labs); };

  const handleOCR = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrResult(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUri = reader.result;
        const isPdf = file.type === 'application/pdf';
        const res = await api.post('/ocr/', { image: dataUri, file_type: isPdf ? 'pdf' : 'image' });
        if (res.data.success) {
          const d = res.data.data.extracted;
          setOcrResult(res.data.data);
          if (d.heart_rate) setVitals((v) => ({ ...v, heartRate: d.heart_rate }));
          if (d.systolic_bp) setVitals((v) => ({ ...v, systolicBP: d.systolic_bp }));
          if (d.diastolic_bp) setVitals((v) => ({ ...v, diastolicBP: d.diastolic_bp }));
          if (d.spo2) setVitals((v) => ({ ...v, spo2: d.spo2 }));
          if (d.temperature) setVitals((v) => ({ ...v, temperature: d.temperature }));
          if (d.respiratory_rate) setVitals((v) => ({ ...v, respiratoryRate: d.respiratory_rate }));
          if (d.cholesterol) setLabs((l) => ({ ...l, cholesterol: d.cholesterol }));
          if (d.blood_glucose) setLabs((l) => ({ ...l, bloodGlucose: d.blood_glucose }));
          if (d.hemoglobin) setLabs((l) => ({ ...l, hemoglobin: d.hemoglobin }));
          if (d.wbc) setLabs((l) => ({ ...l, wbc: d.wbc }));
          if (d.platelets) setLabs((l) => ({ ...l, platelets: d.platelets }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('OCR failed: ' + (err.response?.data?.error || err.message));
    }
    setTimeout(() => setOcrLoading(false), 2000);
  };

  const diagnose = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        vitals: Object.fromEntries(Object.entries(vitals).map(([k, v]) => [k, Number(v)])),
        labValues: Object.fromEntries(Object.entries(labs).map(([k, v]) => [k, Number(v)])),
        lifestyle: { ...lifestyle, age: Number(lifestyle.age) },
      };
      const res = await api.post('/diagnose', payload);
      setResult(res.data.data);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || 'Diagnosis failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-xl">🏥</div>
        <div>
          <h1 className="page-title">Health Diagnosis</h1>
          <p className="page-subtitle">6-disease detection with early alert notifications</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="glass-card-static p-4">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2.5">
                <motion.div
                  animate={{
                    scale: step === i + 1 ? 1.1 : 1,
                    backgroundColor: step > i + 1 ? '#10b981' : step === i + 1 ? '#6366f1' : '#e2e8f0',
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                >
                  {step > i + 1 ? '✓' : i + 1}
                </motion.div>
                <span className={`text-xs font-semibold hidden sm:block ${
                  step === i + 1 ? 'text-brand-600' : step > i + 1 ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {s}
                </span>
              </div>
              {i < 3 && (
                <div className="flex-1 mx-2">
                  <div className={`h-0.5 rounded-full transition-colors ${step > i + 1 ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sample profiles */}
      {step === 1 && (
        <div className="flex gap-2 flex-wrap">
          {SAMPLE_PROFILES.map((p) => (
            <button key={p.label} onClick={() => applySample(p)} className="text-xs font-semibold bg-brand-50 text-brand-600 px-3.5 py-2 rounded-xl hover:bg-brand-100 transition-all hover:shadow-sm border border-brand-100">
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* OCR */}
      {step === 1 && (
        <div className="glass-card-static p-4 !bg-gradient-to-r !from-blue-50/80 !to-indigo-50/80 !border-blue-200/50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg">📄</div>
              <div>
                <p className="font-semibold text-blue-800 text-sm">Upload Medical Report</p>
                <p className="text-[11px] text-blue-500">Auto-extract values via OCR (image or PDF)</p>
              </div>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={ocrLoading}
              className="btn-primary !py-2 !px-4 !text-xs !from-blue-500 !to-blue-600 !shadow-blue-500/25"
            >
              {ocrLoading ? '⏳ Scanning…' : '📷 Upload'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleOCR} className="hidden" />
          {ocrResult && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-600 mt-2 font-medium">
              ✅ Extracted {ocrResult.total_fields_found || 0} fields from report
            </motion.p>
          )}
        </div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
          ⚠️ {error}
        </motion.div>
      )}

      {/* Step 1: Vitals */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-card-static p-6">
            <h2 className="font-bold text-slate-800 text-sm mb-4">Vital Signs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {VITALS_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{f.label}</label>
                  <input
                    type="number" step="any"
                    value={vitals[f.key] ?? ''}
                    onChange={(e) => setVitals({ ...vitals, [f.key]: e.target.value })}
                    placeholder={f.ph}
                    className="input-modern mt-1"
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setStep(2)} className="btn-primary !py-2.5">Next →</button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Labs */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-card-static p-6">
            <h2 className="font-bold text-slate-800 text-sm mb-4">Lab Values</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {LABS_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{f.label}</label>
                  <input
                    type="number" step="any"
                    value={labs[f.key] ?? ''}
                    onChange={(e) => setLabs({ ...labs, [f.key]: e.target.value })}
                    placeholder={f.ph}
                    className="input-modern mt-1"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setStep(1)} className="btn-secondary !py-2.5">← Back</button>
              <button onClick={() => setStep(3)} className="btn-primary !py-2.5">Next →</button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Lifestyle */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-card-static p-6">
            <h2 className="font-bold text-slate-800 text-sm mb-4">Lifestyle & Demographics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Age</label>
                <input type="number" value={lifestyle.age} onChange={(e) => setLifestyle({ ...lifestyle, age: e.target.value })} placeholder="45" className="input-modern mt-1" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Sex</label>
                <select value={lifestyle.sex} onChange={(e) => setLifestyle({ ...lifestyle, sex: e.target.value })} className="input-modern mt-1">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Exercise Level</label>
                <select value={lifestyle.exercise} onChange={(e) => setLifestyle({ ...lifestyle, exercise: e.target.value })} className="input-modern mt-1">
                  <option value="sedentary">Sedentary</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${lifestyle.smoking ? 'bg-brand-500 border-brand-500' : 'border-slate-300 group-hover:border-brand-400'}`}>
                    {lifestyle.smoking && <span className="text-white text-xs">✓</span>}
                  </div>
                  <input type="checkbox" checked={lifestyle.smoking} onChange={(e) => setLifestyle({ ...lifestyle, smoking: e.target.checked })} className="hidden" />
                  <span className="text-sm font-medium text-slate-600">Smoker</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setStep(2)} className="btn-secondary !py-2.5">← Back</button>
              <button onClick={diagnose} disabled={loading} className="btn-primary !py-2.5 !bg-gradient-to-r !from-violet-500 !to-purple-600 !shadow-violet-500/25">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Diagnosing…
                  </span>
                ) : '🏥 Run Diagnosis'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {step === 4 && result && (
          <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <NotificationPanel alerts={result.alerts} />
            <DiagnosisReport report={result} />
            <button onClick={() => { setStep(1); setResult(null); }} className="btn-secondary">
              ← New Diagnosis
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
