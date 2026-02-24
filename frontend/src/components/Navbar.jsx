import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/predict/lab', label: 'Lab Report', icon: '🧪' },
  { to: '/predict/wearable', label: 'Wearable', icon: '📱' },
  { to: '/predict/xray', label: 'X-Ray', icon: '🩻' },
  { to: '/diagnose', label: '🏥 Diagnose', accent: 'purple' },
  { to: '/live', label: '⌚ Live', accent: 'green' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg text-indigo-600">
          <span className="text-2xl">🧬</span> BioTwin AI
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV.map((n) => {
            const active = pathname === n.to;
            const accentClasses =
              n.accent === 'purple'
                ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                : n.accent === 'green'
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : '';
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-indigo-100 text-indigo-700'
                    : accentClasses || 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {n.icon ? `${n.icon} ${n.label}` : n.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.name}</span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
