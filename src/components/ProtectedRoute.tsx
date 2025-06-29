import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthPage } from './AuthPage';
import { PulsingDotsLoader } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-canvas flex items-center justify-center">
        <div className="text-center">
          <PulsingDotsLoader size="lg" className="mx-auto mb-4" />
          <p className="text-text-secondary">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <>{children}</>;
};