import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';

interface AddSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, icon: string, isBacklog: boolean, isDraggable: boolean) => void;
}

export const AddSprintModal: React.FC<AddSprintModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    title: '',
    icon: '🚀',
    isBacklog: false,
    isDraggable: true
  });
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        icon: '🚀',
        isBacklog: false,
        isDraggable: true
      });
      setError(null);
    }
  }, [isOpen]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Sprint title is required');
      return;
    }

    if (formData.title.trim().length < 3) {
      setError('Sprint title must be at least 3 characters long');
      return;
    }

    if (!formData.icon.trim()) {
      setError('Sprint icon is required');
      return;
    }

    onSubmit(
      formData.title.trim(),
      formData.icon.trim(),
      formData.isBacklog,
      formData.isDraggable
    );
    onClose();
  };

  const commonIcons = ['🚀', '⚡', '📋', '🔥', '🎯', '💡', '🛠️', '📈', '🎨', '🔧', '📊', '🌟'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5">
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-[500px]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default relative">
          <h1 className="text-2xl font-bold text-text-primary mb-0">Add New Sprint</h1>
          <p className="text-base text-text-tertiary leading-6">Create a new sprint for your project</p>
          <button
            onClick={onClose}
            className="absolute top-3 right-5 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-error-light border border-error rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-error-dark" />
                <p className="text-error-dark text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sprint Title */}
            <div>
              <label htmlFor="sprintTitle" className="block font-semibold text-sm mb-2 text-text-primary">
                Sprint Title <span className="text-error ml-0.5">*</span>
              </label>
              <input
                id="sprintTitle"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter sprint title..."
                className="w-full px-3 py-2.5 border-2 border-border-default rounded-lg bg-bg-primary text-sm text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)] placeholder-text-placeholder font-inherit"
                required
              />
              <div className="text-xs text-text-tertiary mt-1">
                Choose a descriptive name for your sprint (e.g., "Q1 Features", "Bug Fixes Sprint")
              </div>
            </div>

            {/* Sprint Icon */}
            <div>
              <label htmlFor="sprintIcon" className="block font-semibold text-sm mb-2 text-text-primary">
                Sprint Icon <span className="text-error ml-0.5">*</span>
              </label>
              <div className="space-y-3">
                <input
                  id="sprintIcon"
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="🚀"
                  className="w-full px-3 py-2.5 border-2 border-border-default rounded-lg bg-bg-primary text-sm text-text-primary transition-all focus:outline-none focus:border-devsuite-primary focus:shadow-[0_0_0_3px_rgba(252,128,25,0.1)] placeholder-text-placeholder font-inherit text-center"
                  maxLength={2}
                  required
                />
                
                {/* Common Icons */}
                <div>
                  <p className="text-xs text-text-tertiary mb-2">Popular icons:</p>
                  <div className="grid grid-cols-6 gap-2">
                    {commonIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg transition-all hover:border-devsuite-primary hover:bg-devsuite-primary/5 ${
                          formData.icon === icon
                            ? 'border-devsuite-primary bg-devsuite-primary-subtle'
                            : 'border-border-default bg-bg-primary'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sprint Options */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-text-primary">Sprint Options</h3>
              
              <label className="flex items-center gap-3 p-3 border border-border-default rounded-lg cursor-pointer hover:bg-bg-muted transition-all">
                <input
                  type="checkbox"
                  checked={formData.isBacklog}
                  onChange={(e) => setFormData(prev => ({ ...prev, isBacklog: e.target.checked }))}
                  className="w-4 h-4 text-devsuite-primary border-border-strong rounded focus:ring-devsuite-primary focus:ring-2"
                />
                <div className="flex-1">
                  <span className="font-medium text-text-primary">Backlog Sprint</span>
                  <p className="text-xs text-text-tertiary mt-1">
                    This sprint will be used for storing future stories and ideas
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-border-default rounded-lg cursor-pointer hover:bg-bg-muted transition-all">
                <input
                  type="checkbox"
                  checked={formData.isDraggable}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDraggable: e.target.checked }))}
                  className="w-4 h-4 text-devsuite-primary border-border-strong rounded focus:ring-devsuite-primary focus:ring-2"
                />
                <div className="flex-1">
                  <span className="font-medium text-text-primary">Allow Drag & Drop</span>
                  <p className="text-xs text-text-tertiary mt-1">
                    Enable drag and drop functionality for stories within this sprint
                  </p>
                </div>
              </label>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-default flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-transparent text-text-secondary text-sm font-medium cursor-pointer border border-border-default rounded-lg transition-all hover:bg-bg-muted hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.title.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-devsuite-primary text-text-inverse text-sm font-medium cursor-pointer border border-devsuite-primary rounded-lg transition-all hover:bg-devsuite-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create Sprint
          </button>
        </div>
      </div>
    </div>
  );
};