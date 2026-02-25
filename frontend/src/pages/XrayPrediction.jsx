import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function XrayPrediction() {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef();

  const onFile = (f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setResult(null);
    };
    reader.readAsDataURL(f);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) onFile(e.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/predict/xray', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const record = res.data.data;
      setResult({
        prediction: record.prediction.classification,
        confidence: record.prediction.confidence,
        gradcam: record.explanation?.gradcam_url || null,
      });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Prediction failed');
    }
    setLoading(false);
  };

  const isPneumonia = result?.prediction === 'PNEUMONIA';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">🩻</div>
        <div>
          <h1 className="page-title">X-Ray Analysis</h1>
          <p className="page-subtitle">EfficientNet-B0 CNN with GradCAM visualization</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="glass-card-static p-6">
          <h2 className="font-bold text-slate-800 text-sm mb-4">Upload Chest X-Ray</h2>

          <div
            onClick={() => inputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-brand-400 bg-brand-50/50 scale-[1.02]'
                : preview
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/20'
            }`}
          >
            {preview ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={preview}
                alt="X-ray"
                className="max-h-64 mx-auto rounded-xl shadow-lg"
              />
            ) : (
              <div className="py-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-3">
                  🩻
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Drop your X-ray here or <span className="text-brand-500">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG — max 10MB</p>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="hidden" />

          <button
            onClick={submit}
            disabled={loading || !file}
            className="w-full mt-4 btn-primary !bg-gradient-to-r !from-emerald-500 !to-teal-500 !shadow-emerald-500/25 hover:!shadow-emerald-500/40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing…
              </span>
            ) : '🔬 Analyze X-Ray'}
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
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${
                isPneumonia ? 'from-red-50 to-rose-50 border-red-200' : 'from-emerald-50 to-green-50 border-green-200'
              } border p-6 text-center`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 ${isPneumonia ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 ${isPneumonia ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  <span className="text-3xl">{isPneumonia ? '⚠️' : '✅'}</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Prediction</p>
                <p className={`text-3xl font-black mt-2 ${isPneumonia ? 'text-red-600' : 'text-emerald-600'}`}>
                  {result.prediction}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-1.5 border border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500">Confidence</span>
                  <span className={`text-sm font-bold ${isPneumonia ? 'text-red-600' : 'text-emerald-600'}`}>
                    {(result.confidence * 100)?.toFixed(1)}%
                  </span>
                </div>
              </div>

              {result.gradcam && (
                <div className="glass-card-static p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm">🔥</span>
                    <h3 className="text-sm font-bold text-slate-700">GradCAM Heatmap</h3>
                  </div>
                  <motion.img
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    src={`data:image/png;base64,${result.gradcam}`}
                    alt="GradCAM"
                    className="w-full rounded-xl shadow-md"
                  />
                  <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Red regions = areas the model focused on
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
