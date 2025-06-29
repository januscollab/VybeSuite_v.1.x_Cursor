import React, { useState, useEffect } from 'react';
import { X, User, Save, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useUserSettings } from '../hooks/useUserSettings';
import { PulsingDotsLoader } from './LoadingSpinner';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { userProfile, loading, error, updateSettings, changePassword } = useUserSettings();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    storyNumberPrefix: 'STORY',
    preferredHomepage: 'Sprint Board',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Update form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        email: userProfile.email,
        storyNumberPrefix: userProfile.settings.storyNumberPrefix,
        preferredHomepage: userProfile.settings.preferredHomepage,
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [userProfile]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSaveError(null);
      setSaveSuccess(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordError(null);
      if (userProfile) {
        setFormData({
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          email: userProfile.email,
          storyNumberPrefix: userProfile.settings.storyNumberPrefix,
          preferredHomepage: userProfile.settings.preferredHomepage,
          newPassword: '',
          confirmPassword: ''
        });
      }
    }
  }, [isOpen, userProfile]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    // Clear previous errors
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    setPasswordError(null);

    // Validate passwords if provided
    if (formData.newPassword.trim() || formData.confirmPassword.trim()) {
      if (formData.newPassword !== formData.confirmPassword) {
        setPasswordError('Passwords do not match');
        setSaving(false);
        return;
      }
      
      if (formData.newPassword.length < 6) {
        setPasswordError('Password must be at least 6 characters long');
        setSaving(false);
        return;
      }
    }

    try {
      // Prepare updates object
      const updates: any = {};
      
      // Check if name fields changed
      if (formData.firstName !== userProfile.firstName) {
        updates.firstName = formData.firstName;
      }
      if (formData.lastName !== userProfile.lastName) {
        updates.lastName = formData.lastName;
      }
      
      // Check if settings changed
      if (formData.storyNumberPrefix !== userProfile.settings.storyNumberPrefix) {
        updates.storyNumberPrefix = formData.storyNumberPrefix;
      }
      if (formData.preferredHomepage !== userProfile.settings.preferredHomepage) {
        updates.preferredHomepage = formData.preferredHomepage;
      }

      // Update settings if there are changes
      if (Object.keys(updates).length > 0) {
        const success = await updateSettings(updates);
        if (!success) {
          setSaveError('Failed to update profile settings');
          return;
        }
      }

      // Change password if provided
      if (formData.newPassword.trim()) {
        const success = await changePassword(formData.newPassword);
        if (!success) {
          setSaveError('Failed to change password');
          return;
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const first = formData.firstName.charAt(0).toUpperCase();
    const last = formData.lastName.charAt(0).toUpperCase();
    return first + last || formData.email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    return fullName || formData.email;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-[500px] max-h-[95vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default relative">
          <h1 className="text-2xl font-bold text-text-primary mb-0">Profile Settings</h1>
          <p className="text-base text-text-tertiary leading-6">Manage your account and preferences</p>
          <button
            onClick={onClose}
            className="absolute top-3 right-5 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(95vh-140px)]">
          {loading && !userProfile ? (
            <div className="flex items-center justify-center py-12">
              <PulsingDotsLoader size="lg" className="mr-3" />
              <span className="text-text-secondary">Loading profile...</span>
            </div>
          ) : error ? (
            <div className="bg-error-light border border-error rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-error-dark" />
                <p className="text-error-dark">{error}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Avatar Section */}
              <div className="bg-bg-muted rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-devsuite-primary rounded-full flex items-center justify-center text-text-inverse text-xl font-bold">
                    {getInitials()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{getDisplayName()}</h3>
                    <p className="text-text-tertiary">{formData.email}</p>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {saveSuccess && (
                <div className="bg-success-light border border-success rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-dark" />
                    <p className="text-success-dark text-sm">Profile updated successfully!</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {saveError && (
                <div className="bg-error-light border border-error rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-error-dark" />
                    <p className="text-error-dark text-sm">{saveError}</p>
                  </div>
                </div>
              )}

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-text-primary mb-2">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                      className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-text-primary mb-2">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Smith"
                      className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-muted text-text-secondary cursor-not-allowed"
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    Email address cannot be changed from this interface
                  </p>
                </div>
              </div>

              {/* Project Settings */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Project Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="storyPrefix" className="block text-sm font-medium text-text-primary mb-2">
                      Story Number Prefix
                    </label>
                    <input
                      id="storyPrefix"
                      type="text"
                      value={formData.storyNumberPrefix}
                      onChange={(e) => setFormData(prev => ({ ...prev, storyNumberPrefix: e.target.value }))}
                      placeholder="STORY"
                      className="w-full px-3 py-2.5 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="homepage" className="block text-sm font-medium text-text-primary mb-2">
                      Preferred Homepage
                    </label>
                    <div className="relative">
                      <select
                        id="homepage"
                        value={formData.preferredHomepage}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredHomepage: e.target.value }))}
                        className="w-full px-3 py-2.5 pr-10 border border-border-default rounded-lg bg-bg-primary text-text-primary focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="Sprint Board">Sprint Board</option>
                        <option value="Dashboard">Dashboard</option>
                      </select>
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-quaternary pointer-events-none w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6,9 12,15 18,9"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Security</h3>
                
                {/* Password Error Display */}
                {passwordError && (
                  <div className="mb-4 p-3 bg-error-light border border-error rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-error-dark" />
                      <p className="text-error-dark text-sm">{passwordError}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, newPassword: e.target.value }));
                          setPasswordError(null); // Clear error when user types
                        }}
                        placeholder="Enter new password..."
                        className="w-full px-3 py-2.5 pr-12 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-text-quaternary hover:text-text-secondary transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                          setPasswordError(null); // Clear error when user types
                        }}
                        placeholder="Confirm new password..."
                        className="w-full px-3 py-2.5 pr-12 border border-border-default rounded-lg bg-bg-primary text-text-primary placeholder-text-placeholder focus:outline-none focus:border-devsuite-primary focus:ring-2 focus:ring-devsuite-primary/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-text-quaternary hover:text-text-secondary transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
              </div>
            </form>
          )}
        </div>

                  <div className="bg-info-light border border-info rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 text-info-dark mt-0.5">🔒</div>
                      <div>
                        <h4 className="font-medium text-info-dark text-sm mb-1">Password Requirements</h4>
                        <ul className="text-info-dark text-xs space-y-1">
                          <li>• Minimum 6 characters long</li>
                          <li>• Both password fields must match</li>
                          <li>• Leave blank to keep current password</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-default flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded-lg hover:bg-bg-muted hover:text-text-primary transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !userProfile}
            className="flex items-center gap-2 px-4 py-2 bg-devsuite-primary text-text-inverse text-sm font-medium rounded-lg hover:bg-devsuite-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <PulsingDotsLoader size="sm" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};