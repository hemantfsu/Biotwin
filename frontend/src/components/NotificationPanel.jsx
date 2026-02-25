import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const severityConfig = {
  critical: { bg: 'bg-red-50/80', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', icon: '🚨' },
  high: { bg: 'bg-orange-50/80', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', icon: '⚠️' },
  moderate: { bg: 'bg-amber-50/80', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', icon: '⚠️' },
  low: { bg: 'bg-blue-50/80', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', icon: 'ℹ️' },
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
