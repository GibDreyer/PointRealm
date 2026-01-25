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
            whileHover={!disabled ? { y: -6, scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.96 } : {}}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "relative aspect-[3/4] rounded-lg overflow-hidden group cursor-pointer",
                disabled && !isSelected && "opacity-40 grayscale-[50%] cursor-not-allowed",
                className
            )}
            style={{
                background: isSelected
                    ? 'linear-gradient(145deg, var(--pr-surface-elevated) 0%, var(--pr-surface-slate) 100%)'
                    : 'linear-gradient(145deg, var(--pr-surface-slate) 0%, var(--pr-bg-dark) 100%)',
                border: isSelected
                    ? '2px solid var(--pr-primary-cyan)'
                    : '1px solid var(--pr-surface-border)',
                boxShadow: isSelected
                    ? '0 0 20px var(--pr-primary-glow), 0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
                    : '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            {/* Arcane corner accents */}
            <div 
                className="absolute top-0 left-0 w-3 h-3 pointer-events-none"
                style={{
                    borderTop: isSelected ? '2px solid var(--pr-primary-cyan)' : '1px solid var(--pr-surface-border)',
                    borderLeft: isSelected ? '2px solid var(--pr-primary-cyan)' : '1px solid var(--pr-surface-border)',
                }}
            />
            <div 
                className="absolute top-0 right-0 w-3 h-3 pointer-events-none"
                style={{
                    borderTop: isSelected ? '2px solid var(--pr-primary-cyan)' : '1px solid var(--pr-surface-border)',
                    borderRight: isSelected ? '2px solid var(--pr-primary-cyan)' : '1px solid var(--pr-surface-border)',
                }}
            />
            <div 
                className="absolute bottom-0 left-0 w-3 h-3 pointer-events-none"
                style={{
                    borderBottom: isSelected ? '2px solid var(--pr-primary-cyan)' : '1px solid var(--pr-surface-border)',
                    borderLeft: isSelected ? '2px solid var(--pr-primary-cyan)' : '1px solid var(--pr-surface-border)',
                }}
            />
            <div 
                className="absolute bottom-0 right-0 w-3 h-3 pointer-events-none"
                style={{
                    borderBottom: isSelected ? '2px solid var(--pr-primary-cyan)' : '1px solid var(--pr-surface-border)',
                    borderRight: isSelected ? '2px solid var(--pr-primary-cyan)' : '1px solid var(--pr-surface-border)',
                }}
            />

            {/* Inner gradient overlay */}
            <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{
                    background: isSelected
                        ? 'radial-gradient(ellipse at center, rgba(74,158,255,0.08) 0%, transparent 70%)'
                        : 'radial-gradient(ellipse at center, rgba(255,255,255,0.02) 0%, transparent 70%)',
                    opacity: isSelected ? 1 : 0,
                }}
            />

            {/* Hover glow effect */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(74,158,255,0.06) 0%, transparent 60%)',
                }}
            />

            {/* Main content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                <div className={cn(
                    "relative z-10 transition-all duration-300",
                    isSelected ? "scale-110" : "group-hover:scale-105"
                )}>
                    {value === 'coffee' ? (
                        <Coffee 
                            size={32} 
                            style={{
                                color: isSelected ? 'var(--pr-primary-cyan)' : 'var(--pr-text-muted)',
                                filter: isSelected ? 'drop-shadow(0 0 8px var(--pr-primary-glow))' : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        />
                    ) : value === '?' ? (
                        <HelpCircle 
                            size={32} 
                            style={{
                                color: isSelected ? 'var(--pr-primary-cyan)' : 'var(--pr-text-muted)',
                                filter: isSelected ? 'drop-shadow(0 0 8px var(--pr-primary-glow))' : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        />
                    ) : (
                        <span 
                            className="font-black tracking-tight uppercase"
                            style={{
                                fontFamily: isSpecial ? 'inherit' : 'var(--pr-heading-font)',
                                fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                                color: isSelected ? 'var(--pr-primary-cyan)' : 'var(--pr-text-primary)',
                                textShadow: isSelected 
                                    ? '0 0 12px var(--pr-primary-glow), 0 2px 4px rgba(0,0,0,0.5)' 
                                    : '0 2px 4px rgba(0,0,0,0.5)',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            {value}
                        </span>
                    )}
                </div>

                {/* Bottom rune label */}
                {!isSpecial && (
                    <motion.div 
                        initial={false}
                        animate={{ opacity: isSelected ? 0.9 : 0.4 }}
                        className="absolute bottom-2 pointer-events-none"
                        style={{
                            fontSize: '0.5rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.25em',
                            color: isSelected ? 'var(--pr-primary-cyan)' : 'var(--pr-text-dim)',
                            transition: 'color 0.3s ease',
                        }}
                    >
                        Rune
                    </motion.div>
                )}
            </div>

            {/* Selected glow ring */}
            <AnimatePresence>
                {isSelected && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            boxShadow: 'inset 0 0 20px var(--pr-primary-glow)',
                            borderRadius: 'inherit',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Shimmer effect on hover */}
            <div 
                className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100"
                style={{ transition: 'opacity 0.3s ease' }}
            >
                <div 
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                        transition: 'transform 0.6s ease',
                    }}
                />
            </div>
        </motion.button>
    );
}
