import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Called when the dialog should close */
    onClose: () => void;
    /** Called when the user confirms the action */
    onConfirm?: () => void;
    /** Dialog title */
    title: string;
    /** Dialog description/message */
    description: string;
    /** Confirm button text (default: "Confirm") */
    confirmText?: string;
    /** Cancel button text (default: "Cancel") */
    cancelText?: string;
    /** Visual variant for the confirm action */
    variant?: 'danger' | 'warning' | 'primary';
}

const variantStyles = {
    danger: {
        accent: 'bg-danger',
        icon: 'bg-danger/10 text-danger',
        button: 'bg-danger hover:bg-danger/90',
        border: 'border-danger/30',
    },
    warning: {
        accent: 'bg-warning',
        icon: 'bg-warning/10 text-warning',
        button: 'bg-warning hover:bg-warning/90',
        border: 'border-warning/30',
    },
    primary: {
        accent: 'bg-primary',
        icon: 'bg-primary/10 text-primary',
        button: 'bg-primary hover:bg-primary/90',
        border: 'border-primary/30',
    },
};

/**
 * Modal confirmation dialog for destructive or important actions.
 * Provides a consistent UX for confirming user intentions.
 */
export function ConfirmDialog({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger'
}: ConfirmDialogProps) {
    const styles = variantStyles[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className={`relative pointer-events-auto bg-surface ${styles.border} border rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4 overflow-hidden`}
                    >
                        {/* Top accent line */}
                        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${styles.accent}`} />
                        
                        <div className="flex flex-col gap-4 text-center items-center">
                            <div className={`p-3 rounded-full ${styles.icon} mb-2`}>
                                <AlertTriangle size={24} />
                            </div>
                            
                            <h3 className="text-lg font-bold font-heading">{title}</h3>
                            <p className="text-sm text-textMuted">{description}</p>
                            
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2 rounded-lg border border-border hover:bg-surfaceElevated transition-colors text-sm pr-interactive"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 py-2 rounded-lg ${styles.button} text-white font-bold transition-colors text-sm pr-interactive`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
