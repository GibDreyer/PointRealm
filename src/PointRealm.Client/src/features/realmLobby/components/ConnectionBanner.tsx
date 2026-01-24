import { WifiOff, Loader2, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    isConnecting: boolean;
    onRetry: () => void;
}

export function ConnectionBanner({ isConnecting, onRetry }: Props) {
    return (
        <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="w-full bg-[var(--pr-warning)]/90 backdrop-blur-sm text-[var(--pr-warning-text)] border-b border-[var(--pr-warning-border)] z-50 sticky top-0"
        >
            <div className="container py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <WifiOff size={20} />
                    <span className="font-bold text-sm md:text-base">
                        Connection lost. The magical conduit is unstable.
                    </span>
                </div>
                
                <button 
                    onClick={onRetry}
                    disabled={isConnecting}
                    className="px-4 py-1.5 rounded-full bg-black/10 hover:bg-black/20 font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {isConnecting ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Reconnecting...
                        </>
                    ) : (
                        <>
                            <RotateCw size={16} />
                            Retry
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
