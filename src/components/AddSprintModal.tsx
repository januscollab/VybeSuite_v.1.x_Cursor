import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';

interface AddSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, icon: string, description: string, isBacklog: boolean, isDraggable: boolean) => void;
}

export const AddSprintModal: React.FC<AddSprintModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '🚀'
  });
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        icon: '🚀'
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

    // Default sprint rules: not backlog, draggable enabled
    onSubmit(
      formData.title.trim(),
      formData.icon.trim(),
      formData.description.trim(),
      false, // isBacklog - default to false
      true   // isDraggable - default to true
    );
    onClose();
  };

  const commonIcons = ['🚀', '⚡', '📋', '🔥', '🎯', '💡', '🛠️', '📈', '🎨', '🔧', '📊', '🌟'];

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
              <label htmlFor="sprintTitle" className="form-label">
                Sprint Title <span className="text-error ml-0.5">*</span>
              </label>
              <input
                id="sprintTitle"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter sprint title..."
                className="form-input"
                required
              />
              <div className="text-xs text-text-tertiary mt-1">
                Choose a descriptive name for your sprint (e.g., "Q1 Features", "Bug Fixes Sprint")
              </div>
            </div>

            {/* Sprint Description */}
            <div>
              <label htmlFor="sprintDescription" className="form-label">
                Sprint Description
              </label>
              <textarea
                id="sprintDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the goals and objectives of this sprint..."
                className="form-input resize-vertical min-h-[80px]"
                rows={3}
              />
              <div className="text-xs text-text-tertiary mt-1">
                Provide context about what this sprint aims to achieve and any important notes
              </div>
            </div>

            {/* Sprint Icon */}
            <div>
              <label className="form-label">
                Sprint Icon <span className="text-error ml-0.5">*</span>
              </label>
              <div className="space-y-3">
                {/* Icon Selection Grid */}
                <div>
                  <p className="text-xs text-text-tertiary mb-2">Choose an icon for your sprint:</p>
                  <div className="grid grid-cols-6 gap-2">
                    {commonIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xl transition-all hover:border-devsuite-primary hover:bg-devsuite-primary/5 ${
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
                
                {/* Selected Icon Display */}
                <div className="flex items-center gap-3 p-3 bg-bg-muted rounded-lg">
                  <span className="text-2xl">{formData.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Selected Icon</p>
                    <p className="text-xs text-text-tertiary">This icon will represent your sprint</p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-default flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary-action"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.title.trim()}
            className="btn-primary-action"
          >
            <Plus className="w-4 h-4" />
            Create Sprint
          </button>
        </div>
      </div>
    </div>
  );
};