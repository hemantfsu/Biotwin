import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const severityConfig = {
  critical: { bg: 'bg-red-500/8', border: 'border-red-500/20', text: 'text-red-400', badge: 'bg-red-500/15 text-red-400', icon: '🚨' },
  high: { bg: 'bg-orange-500/8', border: 'border-orange-500/20', text: 'text-orange-400', badge: 'bg-orange-500/15 text-orange-400', icon: '⚠️' },
  moderate: { bg: 'bg-amber-500/8', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-400', icon: '⚠️' },
  low: { bg: 'bg-blue-500/8', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500/15 text-blue-400', icon: 'ℹ️' },
};

export default function NotificationPanel({ alerts = [] }) {
  if (!alerts.length) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span>🔔</span> Health Alerts
      </h3>
      <AnimatePresence>
        {alerts.map((a, i) => {
          const config = severityConfig[a.severity] || severityConfig.low;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border backdrop-blur-sm ${config.bg} ${config.border}`}
            >
              <span className="text-lg mt-0.5">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-bold text-sm ${config.text}`}>{a.disease}</p>
                  <span className={`badge !text-[10px] ${config.badge}`}>{a.severity}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{a.message}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
