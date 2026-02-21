import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for Zustand persist to hydrate from localStorage
    const unsub = useAuthStore.persist.onFinishHydration(() => setReady(true));
    // If already hydrated (e.g. HMR), set ready immediately
    if (useAuthStore.persist.hasHydrated()) setReady(true);
    return unsub;
  }, []);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
