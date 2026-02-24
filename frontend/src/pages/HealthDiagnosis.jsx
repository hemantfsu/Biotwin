import React, { useState, useRef } from 'react';
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
        const res = await api.post('/ocr/extract', { image: dataUri, file_type: isPdf ? 'pdf' : 'image' });
        if (res.data.success) {
          const d = res.data.data.extracted;
          setOcrResult(res.data.data);
          // Auto-fill vitals
          if (d.heart_rate) setVitals((v) => ({ ...v, heartRate: d.heart_rate }));
          if (d.systolic_bp) setVitals((v) => ({ ...v, systolicBP: d.systolic_bp }));
          if (d.diastolic_bp) setVitals((v) => ({ ...v, diastolicBP: d.diastolic_bp }));
          if (d.spo2) setVitals((v) => ({ ...v, spo2: d.spo2 }));
          if (d.temperature) setVitals((v) => ({ ...v, temperature: d.temperature }));
          if (d.respiratory_rate) setVitals((v) => ({ ...v, respiratoryRate: d.respiratory_rate }));
          // Auto-fill labs
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
        labs: Object.fromEntries(Object.entries(labs).map(([k, v]) => [k, Number(v)])),
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🏥 Health Diagnosis</h1>
        <p className="text-gray-500 mt-1">6-disease detection engine with early alert notifications</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {['Vitals', 'Lab Values', 'Lifestyle', 'Results'].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{i + 1}</div>
            <span className={`text-sm ${step === i + 1 ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>{s}</span>
            {i < 3 && <div className="w-8 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Sample profiles */}
      {step === 1 && (
        <div className="flex gap-2 flex-wrap">
          {SAMPLE_PROFILES.map((p) => (
            <button key={p.label} onClick={() => applySample(p)} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100">
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* OCR upload */}
      {step === 1 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-800 text-sm">📄 Upload Medical Report</p>
              <p className="text-xs text-blue-600">Upload a photo or PDF and we'll auto-extract values via OCR</p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={ocrLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {ocrLoading ? 'Scanning…' : '📷 Upload'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleOCR} className="hidden" />
          {ocrResult && (
            <p className="text-xs text-green-600 mt-2">
              ✅ Extracted {ocrResult.fields_found} of {ocrResult.fields_attempted} fields
            </p>
          )}
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {/* Step 1: Vitals */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Vital Signs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {VITALS_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 font-medium">{f.label}</label>
                <input
                  type="number"
                  step="any"
                  value={vitals[f.key] ?? ''}
                  onChange={(e) => setVitals({ ...vitals, [f.key]: e.target.value })}
                  placeholder={f.ph}
                  className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <button onClick={() => setStep(2)} className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600">
            Next →
          </button>
        </div>
      )}

      {/* Step 2: Labs */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Lab Values</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {LABS_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 font-medium">{f.label}</label>
                <input
                  type="number"
                  step="any"
                  value={labs[f.key] ?? ''}
                  onChange={(e) => setLabs({ ...labs, [f.key]: e.target.value })}
                  placeholder={f.ph}
                  className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(1)} className="px-6 py-2 border rounded-lg font-medium text-gray-600 hover:bg-gray-50">← Back</button>
            <button onClick={() => setStep(3)} className="px-6 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600">Next →</button>
          </div>
        </div>
      )}

      {/* Step 3: Lifestyle */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Lifestyle & Demographics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium">Age</label>
              <input type="number" value={lifestyle.age} onChange={(e) => setLifestyle({ ...lifestyle, age: e.target.value })} placeholder="45" className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Sex</label>
              <select value={lifestyle.sex} onChange={(e) => setLifestyle({ ...lifestyle, sex: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Exercise Level</label>
              <select value={lifestyle.exercise} onChange={(e) => setLifestyle({ ...lifestyle, exercise: e.target.value })} className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-300 focus:outline-none">
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={lifestyle.smoking} onChange={(e) => setLifestyle({ ...lifestyle, smoking: e.target.checked })} className="w-4 h-4 text-indigo-600 rounded" />
                Smoker
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(2)} className="px-6 py-2 border rounded-lg font-medium text-gray-600 hover:bg-gray-50">← Back</button>
            <button onClick={diagnose} disabled={loading} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50">
              {loading ? 'Diagnosing…' : '🏥 Run Diagnosis'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && result && (
        <div className="space-y-4">
          <NotificationPanel alerts={result.alerts} />
          <DiagnosisReport report={result} />
          <button onClick={() => { setStep(1); setResult(null); }} className="px-6 py-2 border rounded-lg font-medium text-gray-600 hover:bg-gray-50">
            ← New Diagnosis
          </button>
        </div>
      )}
    </div>
  );
}
