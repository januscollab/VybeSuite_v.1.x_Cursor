import React from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { PulsingDotsLoader } from './LoadingSpinner';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-devsuite-primary rounded-lg flex items-center justify-center text-text-inverse font-bold text-xl mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <PulsingDotsLoader size="lg" className="mx-auto mb-4" />
          <p className="text-text-secondary">Verifying admin permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg-canvas flex items-center justify-center p-6">
        <div className="bg-bg-primary border border-border-default rounded-xl p-8 max-w-md w-full text-center shadow-devsuite">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-12 h-12 text-error" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-6">
            You don't have permission to access the admin dashboard. This area is restricted to super administrators only.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};