import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming cn exists, based on package.json clsx usage

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'rune';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="pointer-events-auto"
    >
      <div
        className={cn(
          "relative min-w-[200px] max-w-sm px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md",
          "font-mono text-sm tracking-wide",
          toastStyles[toast.type]
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span>{toast.message}</span>
          <button
            onClick={onClose}
            className="text-current opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const toastStyles: Record<ToastType, string> = {
  info: "bg-surface-elevated/90 border-primary/30 text-text-primary shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)]",
  success: "bg-surface-elevated/90 border-success/30 text-success shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]",
  warning: "bg-surface-elevated/90 border-warning/30 text-warning shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)]",
  error: "bg-surface-elevated/90 border-danger/30 text-danger shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)]",
  rune: "bg-surface/90 border-secondary/40 text-secondary shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)] font-serif italic border-l-4",
};
