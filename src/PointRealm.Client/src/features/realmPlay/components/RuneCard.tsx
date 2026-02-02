import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Coffee, HelpCircle, Sparkles } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import runeBackground from '@/assets/rune-background.png';

interface RuneCardProps {
    /** The value displayed on the card */
    value: string;
    /** Optional label shown at bottom of card */
    label?: string;
    /** Whether the card is currently selected */
    isSelected?: boolean;
    /** Alias for isSelected (for compatibility) */
    selected?: boolean;
    /** Whether the card is disabled */
    disabled?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Alternative callback that receives the value (for compatibility) */
    onSelect?: (value: string) => void;
    /** Additional CSS classes */
    className?: string;
}

export function RuneCard({ 
    value, 
    label,
    isSelected, 
    selected,
    disabled, 
    onClick, 
    onSelect,
    className 
}: RuneCardProps) {
    const { play } = useSound();
    const isCardSelected = isSelected ?? selected ?? false;
    
    const handleClick = () => {
        if (disabled) return;
        if (!isCardSelected) {
            try {
                play('select');
            } catch (e) {
                console.warn("Sound play failed", e);
            }
        }

        onClick?.();
        onSelect?.(value);
    };

    return (
        <motion.button
            whileHover={!disabled ? { y: -8, scale: 1.05 } : {}}
            whileTap={!disabled ? { scale: 0.95, y: -2 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            disabled={disabled}
            onClick={handleClick}
            aria-pressed={isCardSelected}
            className={cn(
                "relative aspect-[2/3] w-full min-w-[70px] max-w-[120px]",
                "flex flex-col items-center justify-center transition-all duration-500",
                "group outline-none",
                isCardSelected && "pr-rune-card-selected",
                disabled && !isCardSelected && "opacity-40 grayscale-[80%] cursor-not-allowed",
                className
            )}
        >
            {/* The Main Card Body with Bevel */}
            <div className={cn(
                "absolute inset-0 transition-all duration-500 clip-path-bevel",
                isCardSelected 
                    ? "bg-pr-surface-elevated shadow-[0_0_30px_rgba(74,158,255,0.3)]" 
                    : "bg-pr-surface-slate group-hover:bg-pr-surface-elevated shadow-lg"
            )}>
                {/* Surface Texture Overlay - increased visibility */}
                <div 
                    className="absolute inset-0 opacity-60 mix-blend-overlay pointer-events-none bg-cover bg-center"
                    style={{ backgroundImage: `url(${runeBackground})` }}
                />
                
                {/* Idle shimmer on non-selected cards */}
                {!isCardSelected && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent pointer-events-none"
                        initial={{ opacity: 0, x: '-100%' }}
                        animate={{ opacity: [0, 0.5, 0], x: ['0%', '100%', '100%'] }}
                        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                    />
                )}
                
                {/* Border Glow (Selection) */}
                <div className={cn(
                    "absolute inset-0 transition-opacity duration-500 pointer-events-none",
                    isCardSelected ? "opacity-100" : "opacity-0"
                )}>
                    {/* Magical Frame */}
                    <div className="absolute inset-0 border-[2px] border-pr-primary-cyan/40 clip-path-bevel" />
                    <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(74,158,255,0.2)] clip-path-bevel" />
                </div>

                {/* Corner accents - RPG style */}
                <div className={cn(
                    "absolute top-2 left-2 w-2 h-2 border-t border-l transition-colors duration-500",
                    isCardSelected ? "border-pr-primary-cyan" : "border-pr-surface-border group-hover:border-pr-text-muted"
                )} />
                <div className={cn(
                    "absolute top-2 right-2 w-2 h-2 border-t border-r transition-colors duration-500",
                    isCardSelected ? "border-pr-primary-cyan" : "border-pr-surface-border group-hover:border-pr-text-muted"
                )} />
                <div className={cn(
                    "absolute bottom-2 left-2 w-2 h-2 border-b border-l transition-colors duration-500",
                    isCardSelected ? "border-pr-primary-cyan" : "border-pr-surface-border group-hover:border-pr-text-muted"
                )} />
                <div className={cn(
                    "absolute bottom-2 right-2 w-2 h-2 border-b border-r transition-colors duration-500",
                    isCardSelected ? "border-pr-primary-cyan" : "border-pr-surface-border group-hover:border-pr-text-muted"
                )} />
            </div>

            {/* Background "Mana" Glow */}
            <AnimatePresence>
                {isCardSelected && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 z-0 pointer-events-none"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-pr-primary-cyan/10 to-transparent blur-xl" />
                        <motion.div 
                            animate={{ 
                                opacity: [0.3, 0.6, 0.3],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-pr-primary-cyan/20 rounded-full blur-2xl" 
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Card Content Wrapper */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-2">
                
                {/* Decorative Sparkle (only when selected) */}
                {isCardSelected && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-4 right-4 text-pr-primary-cyan/40"
                    >
                        <Sparkles size={12} className="animate-pulse" />
                    </motion.div>
                )}

                {/* The Value / Rune Icon */}
                <div className={cn(
                    "relative flex items-center justify-center transition-all duration-500",
                    isCardSelected ? "scale-110 -translate-y-1" : "group-hover:scale-105"
                )}>
                    {value === 'coffee' ? (
                        <Coffee 
                            size={36} 
                            className={cn(
                                "transition-all duration-500",
                                isCardSelected 
                                    ? "text-pr-primary-cyan drop-shadow-[0_0_12px_rgba(74,158,255,0.6)]" 
                                    : "text-pr-text-muted group-hover:text-pr-text"
                            )}
                        />
                    ) : value === '?' ? (
                        <HelpCircle 
                            size={36} 
                            className={cn(
                                "transition-all duration-500",
                                isCardSelected 
                                    ? "text-pr-primary-cyan drop-shadow-[0_0_12px_rgba(74,158,255,0.6)]" 
                                    : "text-pr-text-muted group-hover:text-pr-text"
                            )}
                        />
                    ) : (
                        <span 
                            className={cn(
                                "font-heading font-black tracking-tighter transition-all duration-500 select-none",
                                isCardSelected 
                                    ? "text-white text-4xl sm:text-5xl drop-shadow-[0_0_15px_rgba(74,158,255,0.8)]" 
                                    : "text-pr-text-muted text-3xl group-hover:text-pr-text md:text-4xl"
                            )}
                            style={{
                                color: isCardSelected ? '#fff' : undefined,
                                WebkitTextStroke: isCardSelected ? '1px rgba(74,158,255,0.3)' : 'none'
                            }}
                        >
                            {value}
                        </span>
                    )}
                </div>

                {/* Sub-label (e.g., "RUNE") */}
                <div className={cn(
                    "mt-4 font-body font-bold text-[0.6rem] tracking-[0.3em] uppercase transition-all duration-500 pointer-events-none select-none",
                    isCardSelected 
                        ? "text-pr-primary-cyan opacity-100" 
                        : "text-pr-text-dim opacity-40 group-hover:opacity-60"
                )}>
                    {label || (value === 'coffee' ? 'Rest' : value === '?' ? 'Unknown' : 'Rune')}
                </div>
            </div>

            {/* Hover Energy Ring (Active State only) */}
            <div className={cn(
                "absolute inset-0 pointer-events-none transition-all duration-500 opacity-0 group-hover:opacity-100",
                "shadow-[0_0_20px_rgba(255,255,255,0.05)] clip-path-bevel"
            )} />

            {/* Magical "Aura" - glowing line at the bottom */}
            <div className={cn(
                "absolute bottom-0 left-1/2 -translate-x-1/2 h-[1px] transition-all duration-700 pointer-events-none",
                isCardSelected ? "w-1/2 bg-pr-primary-cyan shadow-[0_0_10px_#4a9eff]" : "w-0 bg-transparent"
            )} />
        </motion.button>
    );
}
