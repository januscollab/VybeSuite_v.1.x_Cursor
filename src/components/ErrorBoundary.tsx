import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-canvas flex items-center justify-center p-6">
          <div className="bg-bg-primary border border-border-default rounded-xl p-8 max-w-md w-full text-center shadow-devsuite">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-error" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Something went wrong</h1>
            <p className="text-text-secondary mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-devsuite-primary text-text-inverse rounded-lg hover:bg-devsuite-primary-hover transition-colors mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}