import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/predict/lab', label: 'Lab Report', icon: '🧪' },
  { to: '/predict/wearable', label: 'Wearable', icon: '📱' },
  { to: '/predict/xray', label: 'X-Ray', icon: '🩻' },
  { to: '/diagnose', label: 'Diagnose', icon: '🏥' },
  { to: '/live', label: 'Live Vitals', icon: '⌚' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
              🧬
            </div>
            <div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
                BioTwin
              </span>
              <span className="text-[10px] font-bold text-brand-400 ml-1 tracking-widest">AI</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`relative px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    active
                      ? 'text-brand-700 bg-brand-50/80'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  }`}
                >
                  <span className="text-base">{n.icon}</span>
                  <span>{n.label}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 rounded-xl bg-brand-50/80 border border-brand-200/50 -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/60">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-medium text-slate-600 max-w-[100px] truncate">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-xs font-semibold text-slate-400 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200"
            >
              Logout
            </button>
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-slate-200/60 bg-white/90 backdrop-blur-xl"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV.map((n) => {
                const active = pathname === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">{n.icon}</span> {n.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
