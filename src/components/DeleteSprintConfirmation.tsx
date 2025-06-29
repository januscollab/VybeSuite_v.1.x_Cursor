import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteSprintConfirmationProps {
  isOpen: boolean;
  sprintTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteSprintConfirmation: React.FC<DeleteSprintConfirmationProps> = ({
  isOpen,
  sprintTitle,
  onConfirm,
  onCancel
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-md">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-error-light rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Delete Sprint</h1>
              <p className="text-sm text-text-tertiary">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="absolute top-3 right-5 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          <p className="text-text-secondary">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-text-primary">"{sprintTitle}"</span>?
          </p>
          <p className="text-sm text-text-tertiary mt-2">
            This sprint and all its data will be permanently removed.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-default flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-text-secondary border border-border-default rounded-lg hover:bg-bg-muted hover:text-text-primary transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 bg-error text-text-inverse text-sm font-medium rounded-lg hover:bg-error-dark transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Delete Sprint
          </button>
        </div>
      </div>
    </div>
  );
};