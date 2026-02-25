import React from 'react';
import { motion } from 'framer-motion';

function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const bgColor = 'rgba(100,116,139,0.1)';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke={bgColor} strokeWidth="10" />
        <motion.circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl font-black tabular-nums"
          style={{ color }}
        >
          {score}
        </motion.span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">of 100</span>
      </div>
    </div>
  );
}

export default function DiagnosisReport({ report }) {
  if (!report) return null;

  return (
    <div className="dark-card-static p-6 space-y-8">
      {/* Health score ring */}
      <div className="text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Overall Health Score</p>
        <ScoreRing score={report.healthScore} />
      </div>

      {/* Detected conditions */}
      {report.conditions && report.conditions.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Detected Conditions</h3>
          <div className="space-y-2">
            {report.conditions.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between bg-dark-700/40 rounded-xl px-4 py-3.5 border border-dark-600/30 hover:bg-dark-700/60 transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-white">{c.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                </div>
                <span
                  className={`badge ml-3 ${
                    c.severity === 'critical'
                      ? 'bg-red-500/15 text-red-400'
                      : c.severity === 'high'
                      ? 'bg-orange-500/15 text-orange-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}
                >
                  {c.severity}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recommendations</h3>
          <div className="space-y-2">
            {report.recommendations.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 text-sm text-slate-300 bg-emerald-500/8 rounded-xl px-4 py-3 border border-emerald-500/15"
              >
                <span className="text-emerald-500 mt-0.5 text-xs font-bold">✓</span>
                <span className="leading-relaxed">{r}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
