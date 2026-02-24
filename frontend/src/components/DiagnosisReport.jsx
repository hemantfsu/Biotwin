import React from 'react';

export default function DiagnosisReport({ report }) {
  if (!report) return null;

  const scoreColor =
    report.healthScore >= 80
      ? 'text-green-600'
      : report.healthScore >= 60
      ? 'text-amber-500'
      : 'text-red-600';

  return (
    <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-6">
      {/* Health score */}
      <div className="text-center">
        <p className="text-sm text-gray-500 font-medium">Overall Health Score</p>
        <p className={`text-6xl font-black mt-2 ${scoreColor}`}>{report.healthScore}</p>
        <p className="text-sm text-gray-400 mt-1">out of 100</p>
      </div>

      {/* Detected conditions */}
      {report.conditions && report.conditions.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Detected Conditions</h3>
          <div className="space-y-2">
            {report.conditions.map((c, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.description}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    c.severity === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : c.severity === 'high'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {c.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {report.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-green-500 mt-0.5">✓</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
