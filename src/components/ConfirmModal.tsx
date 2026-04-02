import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'var(--danger-muted)',
          iconColor: 'var(--danger)',
          buttonBg: 'var(--danger)',
          buttonColor: '#ffffff',
        };
      case 'warning':
        return {
          iconBg: 'rgba(245, 158, 11, 0.1)',
          iconColor: '#f59e0b',
          buttonBg: '#f59e0b',
          buttonColor: '#ffffff',
        };
      case 'info':
      default:
        return {
          iconBg: 'var(--accent-muted)',
          iconColor: 'var(--accent)',
          buttonBg: 'var(--accent)',
          buttonColor: 'var(--accent-text)',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: styles.iconBg, color: styles.iconColor }}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            </div>
            <button
              onClick={onClose}
              style={{ color: 'var(--text-tertiary)' }}
              className="transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>{message}</p>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ backgroundColor: styles.buttonBg, color: styles.buttonColor }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
