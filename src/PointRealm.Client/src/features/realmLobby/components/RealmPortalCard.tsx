import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, CheckCircle2, XCircle, Link as LinkIcon } from 'lucide-react';

interface Props {
    joinUrl: string;
}

export function RealmPortalCard({ joinUrl }: Props) {
    const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');
    const [ripple, setRipple] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(joinUrl);
            setCopyState('success');
            triggerRipple();
            
            // Revert after delay
            setTimeout(() => setCopyState('idle'), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
            setCopyState('error');
            setTimeout(() => setCopyState('idle'), 3000);
        }
    };

    const triggerRipple = () => {
        setRipple(false);
        setTimeout(() => setRipple(true), 10);
    };

    return (
        <div className="w-full bg-[var(--pr-surface)] border border-[var(--pr-border)] rounded-[var(--pr-radius-xl)] p-5 shadow-[var(--pr-shadow-soft)]">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--pr-text-muted)] mb-4 flex items-center gap-2">
                <LinkIcon size={16} /> Realm Portal
            </h3>

            <div className="relative flex gap-2">
                <div className="relative flex-1">
                    <input 
                        readOnly
                        value={joinUrl}
                        className="w-full h-12 pl-4 pr-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-bg)] border border-[var(--pr-border)] text-[var(--pr-text)] text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[var(--pr-primary)] truncate"
                        onClick={(e) => e.currentTarget.select()}
                    />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--pr-bg)] to-transparent pointer-events-none" />
                </div>
                
                <button
                    onClick={handleCopy}
                    className="relative shrink-0 w-12 h-12 flex items-center justify-center rounded-[var(--pr-radius-md)] bg-[var(--pr-primary)] text-[var(--pr-bg)] hover:shadow-[var(--pr-shadow-hover)] hover:translate-y-[-1px] active:translate-y-[0px] transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--pr-primary)] focus:ring-offset-2 focus:ring-offset-[var(--pr-bg)]"
                    aria-label="Copy Join Link"
                >
                    <AnimatePresence mode='wait'>
                        {copyState === 'success' ? (
                            <motion.div
                                key="check"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                            >
                                <CheckCircle2 size={20} />
                            </motion.div>
                        ) : copyState === 'error' ? (
                            <motion.div
                                key="error"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                            >
                                <XCircle size={20} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="copy"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                            >
                                <Copy size={20} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Ripple Effect */}
                    {ripple && (
                        <span className="absolute inset-0 bg-white/30 rounded-[var(--pr-radius-md)] animate-ping-slow pointer-events-none" />
                    )}
                </button>
                
                {/* QR Placeholder */}
                <button
                    className="shrink-0 w-12 h-12 flex items-center justify-center rounded-[var(--pr-radius-md)] bg-[var(--pr-surface-hover)] border border-[var(--pr-border)] text-[var(--pr-text-muted)] hover:text-[var(--pr-text)] transition-colors opacity-50 cursor-not-allowed"
                    title="QR Code (Coming soon)"
                    disabled
                >
                    <div className="w-5 h-5 border-2 border-current border-dashed rounded-[2px]" />
                </button>
            </div>

            {/* In-place Toast/Feedback Message just below */}
            <div className="h-6 mt-2 relative">
                <AnimatePresence>
                    {copyState === 'success' && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-[var(--pr-success)] font-medium absolute left-0"
                        >
                            Portal link copied to your satchel.
                        </motion.p>
                    )}
                    {copyState === 'error' && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-[var(--pr-danger)] font-medium absolute left-0"
                        >
                            Couldn’t copy. Your browser refused the magic.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
