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
    info: <Info className="w-4 h-4 text-pr-primary" />,
    success: <CheckCircle className="w-4 h-4 text-pr-success" />,
    warning: <AlertTriangle className="w-4 h-4 text-pr-secondary" />,
    error: <AlertTriangle className="w-4 h-4 text-pr-danger" />,
  };

  const accents = {
    info: "bg-pr-primary/20",
    success: "bg-pr-success/20",
    warning: "bg-pr-secondary/20",
    error: "bg-pr-danger/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      layout
      className={cn(
        "pointer-events-auto flex items-center gap-3 py-3 px-4 rounded-lg shadow-2xl border border-pr-border/50",
        "bg-pr-surface relative overflow-hidden min-w-[280px]"
      )}
    >
        {/* Parchment/Stone Texture Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" 
          style={{ backgroundImage: 'var(--pr-texture-noise-overlay)' }}
        />
        
        {/* Bevel effect */}
        <div className="absolute inset-0 pointer-events-none rounded-lg ring-1 ring-white/5 ring-inset" />

        {/* Status Indicator */}
        <div className={cn("w-1 h-8 rounded-full shrink-0", accents[toast.type])} />
        
        <div className="mt-0.5 relative z-10 shrink-0">
          {icons[toast.type]}
        </div>

        <div className="flex-1 relative z-10">
           <p className="text-[11px] font-black uppercase tracking-wider leading-none text-pr-text/90">{toast.message}</p>
        </div>

        <button 
            onClick={() => onClose(toast.id)}
            className="p-1 text-pr-text-muted hover:text-pr-text transition-colors relative z-10 hover:bg-white/5 rounded"
        >
            <X className="w-3.5 h-3.5" />
        </button>
    </motion.div>
  );
};
