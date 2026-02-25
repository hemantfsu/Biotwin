import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../services/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: '◎' },
  { to: '/predict/lab', label: 'Lab Analysis', icon: '🧪' },
  { to: '/predict/wearable', label: 'Wearable AI', icon: '📱' },
  { to: '/predict/xray', label: 'X-Ray CNN', icon: '🩻' },
  { to: '/diagnose', label: 'Diagnosis', icon: '🏥' },
  { to: '/live', label: 'Live Vitals', icon: '⌚' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`hidden md:flex flex-col fixed left-0 top-0 h-screen z-30 bg-dark-850/95 backdrop-blur-xl border-r border-dark-700/40 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[220px]'}`}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-dark-700/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-teal/30 flex items-center justify-center text-accent-cyan text-lg flex-shrink-0 border border-accent-cyan/20">
          🧬
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <span className="font-extrabold text-lg text-white">Bio</span>
            <span className="font-extrabold text-lg text-accent-cyan">Twin</span>
            <span className="text-[10px] font-bold text-accent-cyan/60 ml-1">AI</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-3">Menu</p>
        )}
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                active
                  ? 'text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20'
                  : 'text-slate-400 hover:text-white hover:bg-dark-600/50 border border-transparent'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-accent-cyan"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-dark-700/40">
        <div className={`flex items-center gap-2.5 px-2 py-2 rounded-xl bg-dark-700/40 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan/30 to-accent-teal/40 flex items-center justify-center text-accent-cyan text-xs font-bold flex-shrink-0 border border-accent-cyan/20">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'Patient'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center h-10 border-t border-dark-700/40 text-slate-500 hover:text-accent-cyan transition text-xs"
      >
        {collapsed ? '→' : '←'}
      </button>
    </aside>
  );
}
