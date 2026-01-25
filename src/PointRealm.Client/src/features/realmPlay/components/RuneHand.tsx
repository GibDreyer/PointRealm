
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
    return (
        <div className={cn("fixed bottom-0 left-0 right-0 p-4 sm:p-8 flex items-end justify-center pointer-events-none z-20", className)}>
            <motion.div 
                className="flex items-end -space-x-2 sm:space-x-2 pointer-events-auto pb-safe"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 30 }}
            >
                {options.map((val) => {
                    const isSelected = selectedValue === val;
                    // Calculate rotation for a fan effect if needed, but keeping it flat for now for cleaner UI as per modern references
                    // A slight arch could be nice but flat is safer for functionality
                    return (
                        <motion.div
                            key={val}
                            layoutId={`rune-${val}`}
                            className="relative"
                            whileHover={!disabled ? { y: -20, zIndex: 10 } : {}}
                            animate={{
                                y: isSelected ? -30 : 0,
                                zIndex: isSelected ? 20 : 0,
                                opacity: disabled && !isSelected ? 0.5 : 1,
                            }}
                        >
                            <RuneCard
                                value={val}
                                isSelected={isSelected}
                                disabled={disabled}
                                onClick={() => onVote(val)}
                                className={cn(
                                    "w-14 h-20 sm:w-20 sm:h-28 text-lg sm:text-2xl shadow-xl transition-shadow",
                                    isSelected && "ring-4 ring-pr-primary/50 shadow-[0_0_20px_rgba(var(--pr-primary-rgb),0.4)]"
                                )}
                            />
                        </motion.div>
                    );
                })}
            </motion.div>
            
            {/* Background gradient fade for the bottom area */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-pr-bg via-pr-bg/80 to-transparent -z-10 pointer-events-none" />
        </div>
    );
}
