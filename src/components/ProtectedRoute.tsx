import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthPage } from './AuthPage';
import { PulsingDotsLoader } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while authentication is being checked
  if (loading) {
    return <PulsingDotsLoader />;
  }

  // If no user and not loading, show auth page
  if (!user) {
    return <AuthPage />;
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
};