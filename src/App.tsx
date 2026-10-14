import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { AuthPage } from './pages/Auth';
import { RoleSelectionPage } from './pages/RoleSelection';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { BidderMarketplace } from './pages/BidderMarketplace';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'Customer' | 'Bidder' }) => {
  const { user, profile, effectiveRole, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/role-selection" replace />;
  }

  if (allowedRole && effectiveRole !== allowedRole) {
    // Redirect based on effective role (which respects Dev Mode toggle)
    return <Navigate to={effectiveRole === 'Customer' ? '/customer-dashboard' : '/marketplace'} replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-emerald-100">
      <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium rounded-lg' }} />
      {user && <Navbar />}
      
      <main>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/role-selection" element={
            <ProtectedRoute>
              <RoleSelectionPage />
            </ProtectedRoute>
          } />
          <Route path="/customer-dashboard" element={
            <ProtectedRoute allowedRole="Customer">
              <CustomerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/marketplace" element={
            <ProtectedRoute allowedRole="Bidder">
              <BidderMarketplace />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
