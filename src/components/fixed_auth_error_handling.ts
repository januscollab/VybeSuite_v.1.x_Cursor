// src/components/AuthPage.tsx - FIXED ERROR HANDLING
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PulsingDotsLoader } from './LoadingSpinner';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, resetPassword, loading } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // FIXED: Enhanced error message mapping
  const getErrorMessage = (error: any, mode: string): string => {
    if (!error || !error.message) return 'An unexpected error occurred';
    
    const message = error.message.toLowerCase();
    
    console.log('🔍 Auth error details:', { 
      originalMessage: error.message, 
      code: error.code,
      status: error.status,
      mode 
    });

    // Sign up specific errors
    if (mode === 'signup') {
      if (message.includes('user already registered') || 
          message.includes('user_already_exists') ||
          message.includes('email address is already registered') ||
          error.code === 'user_already_exists' ||
          error.code === '23505' || // Postgres unique constraint
          message.includes('duplicate key')) {
        return 'An account with this email already exists. Please sign in instead, or use "Forgot Password" if you need to reset your credentials.';
      }
      
      if (message.includes('password should be at least')) {
        return 'Password must be at least 6 characters long.';
      }
      
      if (message.includes('invalid email') || message.includes('email must be a valid email')) {
        return 'Please enter a valid email address.';
      }
      
      if (message.includes('signup is disabled') || message.includes('signups not allowed')) {
        return 'Account registration is currently disabled. Please contact support.';
      }
      
      if (message.includes('email rate limit exceeded')) {
        return 'Too many signup attempts. Please wait a few minutes before trying again.';
      }
    }

    // Sign in specific errors  
    if (mode === 'signin') {
      if (message.includes('invalid login credentials') || 
          message.includes('invalid_credentials') ||
          message.includes('invalid email or password')) {
        return 'Invalid email or password. Please check your credentials and try again.';
      }
      
      if (message.includes('email not confirmed') || message.includes('confirm your email')) {
        return 'Please check your email and click the confirmation link before signing in.';
      }
      
      if (message.includes('too many requests') || message.includes('rate limit')) {
        return 'Too many sign-in attempts. Please wait a moment before trying again.';
      }
      
      if (message.includes('user not found')) {
        return 'No account found with this email address. Please sign up or check your email.';
      }
    }

    // Password reset errors
    if (mode === 'reset') {
      if (message.includes('user not found')) {
        return 'No account found with this email address.';
      }
      
      if (message.includes('email rate limit')) {
        return 'Too many password reset requests. Please wait before trying again.';
      }
    }

    // Generic errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'Request timeout. Please try again.';
    }

    // Fallback to original message if it's user-friendly, otherwise generic message
    if (error.message.length < 100 && !message.includes('pgrst') && !message.includes('jwt')) {
      return error.message;
    }
    
    return `Unable to ${mode === 'signup' ? 'create account' : mode === 'signin' ? 'sign in' : 'send reset email'}. Please try again or contact support if the problem persists.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Client-side validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (mode === 'reset') {
      setIsSubmitting(true);
      try {
        const { error } = await resetPassword(email);
        if (error) {
          setError(getErrorMessage(error, 'reset'));
        } else {
          setSuccess('Password reset email sent! Check your inbox.');
          setMode('signin');
        }
      } catch (err) {
        setError(getErrorMessage(err, 'reset'));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(getErrorMessage(error, 'signin'));
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password);
        console.log('🔍 Supabase signUp response:', { error, mode });
        
        if (error) {
          setError(getErrorMessage(error, 'signup'));
        } else {
          setSuccess('Account created! Please check your email to verify your account.');
          setMode('signin');
        }
      }
    } catch (err) {
      console.error('🔍 Unexpected auth error:', err);
      setError(getErrorMessage(err, mode));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-bg-canvas flex items-center justify-center p-6">
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-md">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-default text-center">
          <div className="w-12 h-12 bg-devsuite-primary rounded-lg flex items-center justify-center text-text-inverse font-bold text-xl mx-auto mb-4">
            SM
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h1>
          <p className="text-text-tertiary">
            {mode === 'signin' && 'Sign in to access your Sprint Board'}
            {mode === 'signup' && 'Create your Sprint Board account'}
            {mode === 'reset' && 'Enter your email to reset your password'}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {/* FIXED: Enhanced Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-error-light border border-error rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-error-dark">Authentication Error</p>
                <p className="text-sm text-error-dark mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-success-light border border-success rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-success-dark">Success</p>
                <p className="text-sm text-success-dark mt-1">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-quaternary" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-devsuite-primary/20 focus:border-devsuite-primary transition-all"
                  placeholder="Enter your email"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Field */}
            {mode !== 'reset' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-quaternary" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-devsuite-primary/20 focus:border-devsuite-primary transition-all"
                    placeholder="Enter your password"
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-quaternary hover:text-text-tertiary transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password Field */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-quaternary" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-devsuite-primary/20 focus:border-devsuite-primary transition-all"
                    placeholder="Confirm your password"
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-quaternary hover:text-text-tertiary transition-colors"
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-devsuite-primary text-text-inverse font-medium rounded-lg hover:bg-devsuite-primary-hover focus:outline-none focus:ring-2 focus:ring-devsuite-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' && <User className="w-4 h-4" />}
                  {mode === 'signup' && <User className="w-4 h-4" />}
                  {mode === 'reset' && <Mail className="w-4 h-4" />}
                </>
              )}
              {mode === 'signin' && (isSubmitting ? 'Signing In...' : 'Sign In')}
              {mode === 'signup' && (isSubmitting ? 'Creating Account...' : 'Create Account')}
              {mode === 'reset' && (isSubmitting ? 'Sending Email...' : 'Send Reset Email')}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-border-default text-center space-y-2">
          {mode === 'signin' && (
            <>
              <button
                onClick={() => switchMode('reset')}
                className="text-sm text-devsuite-primary hover:underline"
              >
                Forgot your password?
              </button>
              <p className="text-sm text-text-tertiary">
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-devsuite-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <p className="text-sm text-text-tertiary">
              Already have an account?{' '}
              <button
                onClick={() => switchMode('signin')}
                className="text-devsuite-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <p className="text-sm text-text-tertiary">
              Remember your password?{' '}
              <button
                onClick={() => switchMode('signin')}
                className="text-devsuite-primary hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};