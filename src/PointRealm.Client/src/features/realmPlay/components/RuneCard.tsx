import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Coffee, HelpCircle } from 'lucide-react';

interface RuneCardProps {
    value: string;
    isSelected?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
}

export function RuneCard({ value, isSelected, disabled, onClick, className }: RuneCardProps) {
    const isSpecial = value === '?' || value === 'coffee' || value === 'pass';
    
    return (
        <motion.button
            whileHover={!disabled ? { y: -4 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "relative aspect-[3/4] rounded-md border transition-all duration-300 overflow-hidden group",
                isSelected
                    ? "border-pr-primary bg-pr-primary/10 shadow-[0_0_16px_rgba(6,182,212,0.15)]"
                    : "border-pr-border/40 bg-pr-surface/40 hover:border-pr-primary/40 hover:bg-pr-surface/55",
                disabled && !isSelected && "opacity-40 grayscale-[50%] cursor-not-allowed",
                className
            )}
        >
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'var(--pr-texture-surface-texture)' }} />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className={cn(
                    "relative z-10 transition-all duration-500",
                    isSelected ? "scale-105" : "group-hover:scale-102"
                )}>
                    {value === 'coffee' ? (
                        <Coffee size={36} className={cn("transition-colors duration-300", isSelected ? "text-pr-primary" : "text-pr-text-muted/60")} />
                    ) : value === '?' ? (
                        <HelpCircle size={36} className={cn("transition-colors duration-300", isSelected ? "text-pr-primary" : "text-pr-text-muted/60")} />
                    ) : (
                        <span className={cn(
                             "text-2xl md:text-3xl font-black tracking-tight transition-all duration-300",
                             isSelected ? "text-pr-primary" : "text-pr-text/80",
                             isSpecial ? "text-pr-text-muted" : "uppercase"
                        )} style={{ fontFamily: isSpecial ? 'inherit' : 'var(--pr-heading-font)' }}>
                            {value}
                        </span>
                    )}
                </div>

                {/* Bottom Value Label */}
                {!isSpecial && (
                    <motion.div 
                        initial={false}
                        animate={{ opacity: isSelected ? 0.9 : 0.3 }}
                        className={cn(
                            "absolute bottom-3 text-[9px] font-bold uppercase tracking-[0.35em] transition-colors duration-300 pointer-events-none",
                            isSelected ? "text-pr-primary" : "text-pr-text-muted"
                        )}
                    >
                        Rune
                    </motion.div>
                )}
            </div>

            <div className={cn(
                "absolute inset-0 border border-transparent transition-all duration-300",
                isSelected && "border-pr-primary/50 shadow-[inset_0_0_20px_rgba(6,182,212,0.15)]"
            )} />

            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute inset-0 ring-1 ring-pr-primary/40 pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </motion.button>
    );
}
