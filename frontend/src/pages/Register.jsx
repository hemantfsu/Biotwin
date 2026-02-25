import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../services/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="blob w-96 h-96 bg-accent-teal/5 top-10 right-20" />
      <div className="blob w-80 h-80 bg-accent-cyan/5 bottom-10 left-20" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-cyan to-emerald-500 flex items-center justify-center shadow-lg shadow-accent-cyan/20">
            <span className="text-2xl">🧬</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            BioTwin <span className="text-accent-cyan">AI</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Create your digital health twin</p>
        </div>

        <div className="dark-card-static p-8">
          <h2 className="text-xl font-bold text-white mb-1">Create account</h2>
          <p className="text-slate-500 text-sm mb-6">Start your personalized health journey</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="John Doe" className="input-dark" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className="input-dark" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="input-dark" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="input-dark">
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                  Creating…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-cyan font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
