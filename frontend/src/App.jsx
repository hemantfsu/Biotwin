import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './services/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LabPrediction from './pages/LabPrediction';
import WearablePrediction from './pages/WearablePrediction';
import XrayPrediction from './pages/XrayPrediction';
import HealthDiagnosis from './pages/HealthDiagnosis';
import LiveVitals from './pages/LiveVitals';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 },
};
const pageTransition = { type: 'tween', ease: 'easeInOut', duration: 0.25 };

function PageWrap({ children }) {
  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      {children}
    </motion.div>
  );
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-dark-600 border-t-accent-cyan rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading BioTwin…</p>
        </div>
      </div>
    );
  return user ? children : <Navigate to="/login" />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageWrap><Login /></PageWrap>} />
        <Route path="/register" element={<PageWrap><Register /></PageWrap>} />
        <Route path="/dashboard" element={<PrivateRoute><PageWrap><Dashboard /></PageWrap></PrivateRoute>} />
        <Route path="/predict/lab" element={<PrivateRoute><PageWrap><LabPrediction /></PageWrap></PrivateRoute>} />
        <Route path="/predict/wearable" element={<PrivateRoute><PageWrap><WearablePrediction /></PageWrap></PrivateRoute>} />
        <Route path="/predict/xray" element={<PrivateRoute><PageWrap><XrayPrediction /></PageWrap></PrivateRoute>} />
        <Route path="/diagnose" element={<PrivateRoute><PageWrap><HealthDiagnosis /></PageWrap></PrivateRoute>} />
        <Route path="/live" element={<PrivateRoute><PageWrap><LiveVitals /></PageWrap></PrivateRoute>} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-dark-900">
      {user && <Sidebar />}
      <div className={user ? 'md:ml-[220px] min-h-screen flex flex-col' : ''}>
        {user && <Navbar />}
        <main className={user ? 'flex-1 p-4 md:p-6 lg:p-8' : ''}>
          <AnimatedRoutes />
        </main>
      </div>
      {user && <Chatbot />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
