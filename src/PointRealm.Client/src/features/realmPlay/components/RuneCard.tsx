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
            whileHover={!disabled ? { y: -5, scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "relative aspect-[2/3] w-full rounded-xl border-2 transition-all duration-300 overflow-hidden group",
                isSelected 
                    ? "border-pr-primary bg-pr-primary/10 shadow-[0_0_25px_-5px_rgba(6,182,212,0.6)] ring-1 ring-pr-primary/50" 
                    : "border-pr-border/30 bg-pr-surface hover:border-pr-primary/40 hover:shadow-[0_0_20px_-10px_rgba(6,182,212,0.3)]",
                disabled && !isSelected && "opacity-40 grayscale cursor-not-allowed",
                className
            )}
        >
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] pointer-events-none" />
            
            {/* Bevel Effect */}
            <div className="absolute inset-0 border border-white/5 rounded-[calc(var(--pr-radius-xl)-2px)] pointer-events-none" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                {/* Decoration */}
                <div className={cn(
                    "absolute top-2 left-2 right-2 bottom-2 rounded-lg border border-dashed transition-opacity duration-500",
                    isSelected ? "border-pr-primary/20 opacity-100" : "border-pr-border/10 opacity-0 group-hover:opacity-100"
                )} />

                <div className={cn(
                    "relative z-10 transition-all duration-300",
                    isSelected ? "scale-110" : "group-hover:scale-105"
                )}>
                    {value === 'coffee' ? (
                        <Coffee size={32} className={cn(isSelected ? "text-pr-primary" : "text-pr-text-muted")} />
                    ) : value === '?' ? (
                        <HelpCircle size={32} className={cn(isSelected ? "text-pr-primary" : "text-pr-text-muted")} />
                    ) : (
                        <span className={cn(
                             "text-3xl md:text-4xl font-black tracking-tighter",
                             isSelected ? "text-pr-primary" : "text-pr-text",
                             isSpecial && "text-pr-text-muted"
                        )}>
                            {value}
                        </span>
                    )}
                </div>

                {/* Bottom Value Label */}
                {!isSpecial && (
                    <div className={cn(
                        "absolute bottom-3 text-[10px] font-black uppercase tracking-[0.2em] transition-opacity",
                        isSelected ? "text-pr-primary opacity-60" : "text-pr-text-muted opacity-20"
                    )}>
                        Rune Value
                    </div>
                )}
            </div>

            {/* Selection Glow */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-pr-primary/20 via-transparent to-transparent pointer-events-none"
                    />
                )}
            </AnimatePresence>
        </motion.button>
    );
}
