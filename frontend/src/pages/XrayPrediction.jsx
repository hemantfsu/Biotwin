import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function XrayPrediction() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/predict/xray', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const isPneumonia = result?.prediction?.toLowerCase().includes('pneumonia');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-accent-cyan/60 text-xs font-semibold uppercase tracking-widest mb-1">X-Ray CNN Module</p>
        <h1 className="text-2xl font-extrabold text-white">🩻 Chest X-Ray Analysis</h1>
        <p className="text-slate-400 text-sm mt-1">Deep CNN with Grad-CAM heatmap visualization</p>
      </motion.div>

      {/* Upload */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="dark-card-static p-6">
        <form onSubmit={handleSubmit}>
          <div
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? 'border-accent-cyan bg-accent-cyan/5'
                : 'border-dark-500/50 hover:border-dark-400/60 hover:bg-dark-700/20'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleFile(e.target.files[0])} />
            {preview ? (
              <div className="flex flex-col items-center">
                <img src={preview} alt="Preview" className="max-h-56 rounded-xl shadow-lg shadow-dark-900/50 mb-3" />
                <p className="text-xs text-slate-400">{file?.name}</p>
                <p className="text-[10px] text-slate-600 mt-1">Click or drop to replace</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-600/40 flex items-center justify-center text-3xl">
                  🩻
                </div>
                <p className="text-sm font-semibold text-white mb-1">Drop chest X-ray image here</p>
                <p className="text-xs text-slate-500">or click to browse · PNG, JPG, DICOM</p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading || !file}
            className="btn-primary mt-5 w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Analyzing X-Ray…' : 'Run CNN Analysis'}
          </button>
        </form>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-4">
            <div className={`dark-card-static p-6 border-l-4 ${isPneumonia ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Diagnosis</p>
                  <h3 className={`text-2xl font-black ${isPneumonia ? 'text-red-400' : 'text-emerald-400'}`}>
                    {result.prediction}
                  </h3>
                </div>
                <div className="bg-dark-700/50 rounded-xl p-4 md:text-right">
                  <p className="text-xs text-slate-500 mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-white">{(result.confidence * 100)?.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {result.gradcam && (
              <div className="dark-card-static p-6">
                <h3 className="font-bold text-white text-sm mb-1">Grad-CAM Heatmap</h3>
                <p className="text-xs text-slate-500 mb-4">Regions of interest highlighted by the neural network</p>
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${result.gradcam}`}
                    alt="GradCAM"
                    className="max-h-80 rounded-xl shadow-lg shadow-dark-900/50"
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
