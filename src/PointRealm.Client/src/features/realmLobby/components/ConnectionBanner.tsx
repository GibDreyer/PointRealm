import { WifiOff, Loader2, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface Props {
    isConnecting: boolean;
    onRetry: () => void;
}

export function ConnectionBanner({ isConnecting, onRetry }: Props) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className={cn(
                "w-full bg-pr-surface/90 backdrop-blur-md text-pr-text border-b border-pr-border/70 z-[100] sticky top-0",
                "shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            )}
        >
            <div className="relative max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'var(--pr-texture-noise-overlay)' }} />
                <div className="absolute inset-0 pointer-events-none rounded-b-2xl ring-1 ring-white/5 ring-inset" />
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-pr-primary/10 border border-pr-primary/20 shadow-[0_0_12px_rgba(96,215,255,0.18)]">
                        {isConnecting ? <Loader2 size={16} className="animate-spin text-pr-primary" /> : <WifiOff size={16} className="text-pr-primary" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-[10px] uppercase tracking-[0.35em] text-pr-text-muted">Realm Signal</span>
                        <span className="font-bold text-sm leading-tight text-pr-text">
                            {isConnecting ? 'The portal is unstable… reconnecting' : 'The portal has fallen silent'}
                        </span>
                        <span className="text-[11px] text-pr-text-muted">Connection lost</span>
                    </div>
                </div>
                
                <button 
                    onClick={onRetry}
                    disabled={isConnecting}
                    className="px-4 py-1.5 rounded-full bg-black/30 text-pr-primary border border-pr-primary/30 hover:border-pr-primary/60 font-black text-[10px] uppercase tracking-[0.35em] transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    aria-label="Retry connection"
                    title="Retry connection"
                >
                    {isConnecting ? 'Stabilizing…' : (
                        <>
                            <RotateCw size={12} />
                            Relink
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
