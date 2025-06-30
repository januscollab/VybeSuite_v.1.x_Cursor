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

  // Enhanced error message mapping
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
      // Handle the new database error
      if (message.includes('database error saving new user') ||
          message.includes('unexpected_failure')) {
        return 'There was a system error creating your account. Please try again or contact support if the problem persists.';
      }
      
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
            {mode === 'signin' && 'Sign in to your Sprint Board account'}
            {mode === 'signup' && 'Create your Sprint Board account'}
            {mode === 'reset' && 'Enter your email to reset your password'}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-bg-error/10 border border-border-error rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-text-error flex-shrink-0" />
              <span className="text-sm text-text-error">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-bg-success/10 border border-border-success rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-text-success flex-shrink-0" />
              <span className="text-sm text-text-success">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Hidden username field for accessibility */}
            {mode !== 'reset' && (
              <input
                type="text"
                name="username"
                value={email}
                onChange={() => {}}
                style={{ display: 'none' }}
                autoComplete="username"
                aria-hidden="true"
                tabIndex={-1}
                readOnly
              />
            )}

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
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-devsuite-primary/20 focus:border-devsuite-primary transition-all"
                  placeholder="Enter your email address"
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
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                    autoComplete="new-password"
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
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
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
                type="button"
                onClick={() => switchMode('reset')}
                className="text-sm text-devsuite-primary hover:underline"
              >
                Forgot your password?
              </button>
              <p className="text-sm text-text-tertiary">
                Don't have an account?{' '}
                <button
                  type="button"
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
                type="button"
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
                type="button"
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