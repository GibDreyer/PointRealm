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
            className="w-full bg-pr-danger/90 backdrop-blur-md text-pr-bg border-b border-pr-danger z-[100] sticky top-0 shadow-lg shadow-pr-danger/10"
        >
            <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pr-bg/20">
                        <WifiOff size={16} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-[10px] uppercase tracking-widest opacity-70">Magical Instability</span>
                        <span className="font-bold text-sm leading-tight">
                            The conduit has collapsed. Re-establishing link...
                        </span>
                    </div>
                </div>
                
                <button 
                    onClick={onRetry}
                    disabled={isConnecting}
                    className="px-4 py-1.5 rounded-full bg-pr-bg text-pr-danger hover:bg-pr-bg/90 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                >
                    {isConnecting ? (
                        <>
                            <Loader2 size={12} className="animate-spin" />
                            Summoning...
                        </>
                    ) : (
                        <>
                            <RotateCw size={12} />
                            Retry Ritual
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
