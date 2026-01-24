import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
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

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  const icons = {
    info: <Info className="w-5 h-5 text-pr-primary" />,
    success: <CheckCircle className="w-5 h-5 text-pr-success" />,
    warning: <AlertTriangle className="w-5 h-5 text-pr-secondary" />,
    error: <AlertTriangle className="w-5 h-5 text-pr-danger" />,
  };

  const borders = {
    info: "border-pr-primary/50",
    success: "border-pr-success/50",
    warning: "border-pr-secondary/50",
    error: "border-pr-danger/50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      layout
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-[var(--pr-radius-md)] shadow-lg border",
        "bg-[#1e1e24] text-pr-text relative overflow-hidden", // Fallback bg if pr-surface not resolved, but should be pr-surface
        "bg-pr-surface",
        borders[toast.type]
      )}
    >
        {/* Parchment texture overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] pointer-events-none mix-blend-overlay" />
        
        <div className="mt-0.5 relative z-10 shrink-0">
          {icons[toast.type]}
        </div>
        <div className="flex-1 relative z-10 pt-0.5">
           <p className="text-sm font-medium leading-tight">{toast.message}</p>
        </div>
        <button 
            onClick={() => onClose(toast.id)}
            className="text-pr-text-muted hover:text-pr-text transition-colors relative z-10"
        >
            <X className="w-4 h-4" />
        </button>
    </motion.div>
  );
};
