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
            whileHover={!disabled ? { y: -8, scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "relative aspect-[2/3] w-full rounded-xl border-2 transition-all duration-500 overflow-hidden group",
                isSelected 
                    ? "border-pr-primary bg-pr-primary/10 shadow-glow-primary/40 ring-1 ring-pr-primary/40" 
                    : "border-pr-border/30 bg-pr-surface/40 hover:border-pr-primary/40 hover:bg-pr-surface/60 hover:shadow-glow-primary/10",
                disabled && !isSelected && "opacity-40 grayscale-[50%] cursor-not-allowed",
                className
            )}
        >
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none mix-blend-overlay" />
            
            {/* Inset Shadow/Inner Glow */}
            <div className={cn(
                "absolute inset-0 transition-opacity duration-700 pointer-events-none",
                isSelected ? "opacity-100 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]" : "opacity-0"
            )} />

            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                {/* Decoration Frame */}
                <div className={cn(
                    "absolute top-2.5 left-2.5 right-2.5 bottom-2.5 rounded-lg border border-dashed transition-all duration-700",
                    isSelected ? "border-pr-primary/30 opacity-100 scale-100" : "border-pr-border/10 opacity-0 group-hover:opacity-100 scale-95"
                )} />

                <div className={cn(
                    "relative z-10 transition-all duration-500",
                    isSelected ? "scale-115" : "group-hover:scale-105"
                )}>
                    {value === 'coffee' ? (
                        <Coffee size={40} className={cn("transition-colors duration-500", isSelected ? "text-pr-primary" : "text-pr-text-muted/60")} />
                    ) : value === '?' ? (
                        <HelpCircle size={40} className={cn("transition-colors duration-500", isSelected ? "text-pr-primary" : "text-pr-text-muted/60")} />
                    ) : (
                        <span className={cn(
                             "text-4xl md:text-5xl font-black tracking-tighter transition-all duration-500",
                             isSelected ? "text-pr-primary drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "text-pr-text/80",
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
                        animate={{ opacity: isSelected ? 0.8 : 0.2 }}
                        className={cn(
                            "absolute bottom-4 text-[8px] font-black uppercase tracking-[0.4em] italic transition-colors duration-500",
                            isSelected ? "text-pr-primary" : "text-pr-text-muted"
                        )}
                    >
                        Rune
                    </motion.div>
                )}
            </div>

            {/* Selection Radial Glow */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="absolute inset-0 bg-gradient-radial from-pr-primary/20 via-transparent to-transparent pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </motion.button>
    );
}
