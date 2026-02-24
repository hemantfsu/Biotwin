import React from 'react';

export default function NotificationPanel({ alerts = [] }) {
  if (!alerts.length) return null;

  return (
    <div className="space-y-2 mb-6">
      {alerts.map((a, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium border ${
            a.severity === 'critical'
              ? 'bg-red-50 border-red-300 text-red-800'
              : a.severity === 'high'
              ? 'bg-orange-50 border-orange-300 text-orange-800'
              : a.severity === 'moderate'
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-blue-50 border-blue-300 text-blue-800'
          }`}
        >
          <span className="text-lg">
            {a.severity === 'critical' ? '🚨' : a.severity === 'high' ? '⚠️' : 'ℹ️'}
          </span>
          <div>
            <p className="font-semibold">{a.disease}</p>
            <p className="text-xs mt-0.5 opacity-80">{a.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
