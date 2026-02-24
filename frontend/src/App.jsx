import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/AuthContext';
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

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-xl">Loading…</div>;
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <div className={user ? 'pt-4 pb-8 px-4 md:px-8' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/predict/lab" element={<PrivateRoute><LabPrediction /></PrivateRoute>} />
          <Route path="/predict/wearable" element={<PrivateRoute><WearablePrediction /></PrivateRoute>} />
          <Route path="/predict/xray" element={<PrivateRoute><XrayPrediction /></PrivateRoute>} />
          <Route path="/diagnose" element={<PrivateRoute><HealthDiagnosis /></PrivateRoute>} />
          <Route path="/live" element={<PrivateRoute><LiveVitals /></PrivateRoute>} />
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
        </Routes>
      </div>
      {user && <Chatbot />}
    </>
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
