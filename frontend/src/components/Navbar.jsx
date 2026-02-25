import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: '◎' },
  { to: '/predict/lab', label: 'Lab', icon: '🧪' },
  { to: '/predict/wearable', label: 'Wearable', icon: '📱' },
  { to: '/predict/xray', label: 'X-Ray', icon: '🩻' },
  { to: '/diagnose', label: 'Diagnose', icon: '🏥' },
  { to: '/live', label: 'Vitals', icon: '⌚' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-dark-850/90 backdrop-blur-xl border-b border-dark-700/40">
      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Mobile logo */}
          <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-teal/30 flex items-center justify-center text-accent-cyan text-base border border-accent-cyan/20">
              🧬
            </div>
            <span className="font-extrabold text-base text-white">Bio<span className="text-accent-cyan">Twin</span></span>
          </Link>

          {/* Desktop: Page context */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">⚡ Powered by Advanced AI</span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700/50 border border-dark-600/50">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent-cyan/30 to-accent-teal/40 flex items-center justify-center text-accent-cyan text-[10px] font-bold border border-accent-cyan/20">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-medium text-slate-300 max-w-[100px] truncate">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-xs font-semibold text-slate-500 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
            >
              Logout
            </button>
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-lg bg-dark-700/50 flex items-center justify-center text-slate-400 hover:text-white border border-dark-600/50 transition"
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
            className="md:hidden overflow-hidden border-t border-dark-700/40 bg-dark-850/95 backdrop-blur-xl"
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
                      active ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' : 'text-slate-400 hover:text-white hover:bg-dark-600/50 border border-transparent'
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
