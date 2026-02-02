
import { motion } from 'framer-motion';
import { RuneCard } from './RuneCard';
import { cn } from '../../../lib/utils';

interface RuneHandProps {
    options: string[];
    selectedValue?: string | null;
    disabled: boolean;
    onVote: (value: string) => void;
    className?: string;
}

export function RuneHand({ options, selectedValue, disabled, onVote, className }: RuneHandProps) {
    const cardCount = options.length;
    const arcAngle = 12; // Total arc spread in degrees
    const liftAmount = 8; // Vertical offset for arc effect in pixels
    
    const getCardTransform = (index: number) => {
        const middle = (cardCount - 1) / 2;
        const offset = index - middle;
        const normalizedOffset = offset / (cardCount / 2);
        
        return {
            rotate: normalizedOffset * (arcAngle / 2),
            y: Math.abs(normalizedOffset) * liftAmount,
            originY: 1, // Rotate from bottom
        };
    };

    return (
        <div className={cn("fixed bottom-0 left-0 right-0 flex flex-col items-center pointer-events-none z-20", className)}>
            {/* Atmospheric backdrop */}
            <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none">
                {/* Primary gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-pr-bg via-pr-bg/95 to-transparent" />
                {/* Arcane glow layer */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-pr-primary/5 to-transparent opacity-60" />
                {/* Subtle noise texture overlay */}
                <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
            </div>

            {/* Card rail / shelf effect */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl h-1 bg-gradient-to-r from-transparent via-pr-border/30 to-transparent rounded-full" />

            {/* The Hand of Cards */}
            <motion.div 
                className="relative flex items-end justify-center pointer-events-auto pb-4 sm:pb-6 px-4"
                initial={{ y: 120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 25 }}
            >
                {options.map((val, index) => {
                    const isSelected = selectedValue === val;
                    const transform = getCardTransform(index);
                    
                    return (
                        <motion.div
                            key={val}
                            layoutId={`rune-${val}`}
                            className="relative -mx-1 sm:mx-0.5"
                            initial={{ y: 50, opacity: 0, rotate: transform.rotate }}
                            animate={{
                                y: isSelected ? -40 : transform.y,
                                rotate: isSelected ? 0 : transform.rotate,
                                zIndex: isSelected ? 30 : 10 - Math.abs(index - (cardCount - 1) / 2),
                                opacity: disabled && !isSelected ? 0.5 : 1,
                                scale: isSelected ? 1.1 : 1,
                            }}
                            whileHover={!disabled ? { 
                                y: isSelected ? -40 : -25, 
                                scale: 1.08,
                                zIndex: 20,
                                rotate: 0,
                            } : {}}
                            transition={{ 
                                type: "spring", 
                                stiffness: 400, 
                                damping: 30,
                                delay: index * 0.03 // Staggered entrance
                            }}
                            style={{ originY: 1 }}
                        >
                            <RuneCard
                                value={val}
                                isSelected={isSelected}
                                disabled={disabled}
                                onClick={() => onVote(val)}
                                className={cn(
                                    "w-12 h-16 sm:w-16 sm:h-22 md:w-20 md:h-28 shadow-xl transition-shadow duration-300",
                                    isSelected && "shadow-[0_0_30px_rgba(74,158,255,0.5)]"
                                )}
                            />
                            
                            {/* Selection glow effect */}
                            {isSelected && (
                                <motion.div 
                                    className="absolute -inset-2 rounded-xl bg-pr-primary/20 blur-xl -z-10"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
