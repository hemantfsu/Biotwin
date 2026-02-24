import React, { useState, useRef } from 'react';
import api from '../services/api';

export default function XrayPrediction() {
  const [preview, setPreview] = useState(null);
  const [base64, setBase64] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setBase64(reader.result);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!base64) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/predict/xray', { image: base64 });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">🩻 X-Ray Analysis</h1>
        <p className="text-gray-500 mt-1">EfficientNet-B0 CNN with GradCAM visualization</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Upload Chest X-Ray</h2>

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition"
          >
            {preview ? (
              <img src={preview} alt="X-ray" className="max-h-64 mx-auto rounded-lg" />
            ) : (
              <div>
                <p className="text-4xl mb-2">🩻</p>
                <p className="text-gray-500 text-sm">Click to upload a chest X-ray image</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG — max 10MB</p>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

          <button
            onClick={submit}
            disabled={loading || !base64}
            className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
          >
            {loading ? 'Analyzing…' : '🔬 Analyze X-Ray'}
          </button>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className={`rounded-2xl p-6 text-center border ${
              result.prediction === 'PNEUMONIA' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
            }`}>
              <p className="text-sm font-medium text-gray-600">Prediction</p>
              <p className={`text-3xl font-black mt-2 ${
                result.prediction === 'PNEUMONIA' ? 'text-red-600' : 'text-green-600'
              }`}>
                {result.prediction}
              </p>
              <p className="text-gray-500 mt-1">Confidence: {(result.confidence * 100)?.toFixed(1)}%</p>
            </div>

            {result.gradcam && (
              <div className="bg-white rounded-2xl border p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🔥 GradCAM Heatmap</h3>
                <img src={`data:image/png;base64,${result.gradcam}`} alt="GradCAM" className="w-full rounded-xl" />
                <p className="text-xs text-gray-400 mt-2">Red regions = areas the model focused on</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
