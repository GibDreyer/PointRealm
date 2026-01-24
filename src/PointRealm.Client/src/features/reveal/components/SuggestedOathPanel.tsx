import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestedOathPanelProps {
  suggestion: { kind: 'median' | 'mode'; value: string } | null;
  deckValues: string[];
  isGM: boolean;
  onSealOutcome: (value: string) => Promise<void>;
  className?: string;
}

export const SuggestedOathPanel: React.FC<SuggestedOathPanelProps> = ({
  suggestion,
  deckValues,
  isGM,
  onSealOutcome,
  className
}) => {
  const [sealingValue, setSealingValue] = useState<string | null>(null);

  const handleSeal = async (val: string) => {
    if (sealingValue) return; // Prevent double click
    setSealingValue(val);
    try {
      await onSealOutcome(val);
    } catch (e) {
      console.error("Failed to seal", e);
      setSealingValue(null);
    }
    // Success flow usually handled by parent/server update, but we can reset if needed or keep loading
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      
      {/* Suggestion Section */}
      {suggestion && (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl bg-surface/50 border border-primary/20 p-4 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                <Crown size={64} />
            </div>
            
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
               Suggested Oath
            </h4>
            
            <div className="flex items-center gap-4">
                <div className="w-12 h-16 rounded-lg bg-surfaceElevated border border-primary flex items-center justify-center text-2xl font-heading font-bold text-primary shadow-lg shadow-primary/10">
                    {suggestion.value}
                </div>
                <div>
                   <div className="text-sm font-bold text-text">
                       Based on {suggestion.kind === 'median' ? 'Median' : 'Mode'}
                   </div>
                   <div className="text-xs text-textMuted max-w-[200px]">
                       {suggestion.kind === 'median' ? 'A steady middle path.' : 'The party’s most chosen rune.'}
                   </div>
                </div>
            </div>
        </motion.div>
      )}

      {/* GM Controls */}
      {isGM && (
        <div className="space-y-3">
             <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--pr-secondary)] border-b border-[var(--pr-secondary)]/30 pb-2 flex items-center gap-2">
                <Crown size={14} /> Seal the Outcome
             </h3>
             
             <div className="flex flex-wrap gap-2">
                {deckValues.map(val => (
                    <button
                        key={val}
                        onClick={() => handleSeal(val)}
                        disabled={!!sealingValue}
                        className={cn(
                            "relative w-10 h-10 rounded border text-sm font-bold transition-all",
                            "hover:scale-105 active:scale-95",
                            sealingValue === val 
                               ? "bg-[var(--pr-secondary)] text-black border-[var(--pr-secondary)]"
                               : "bg-surface border-border hover:border-[var(--pr-secondary)] hover:text-[var(--pr-secondary)]"
                        )}
                        aria-label={`Seal outcome as ${val}`}
                    >
                        {sealingValue === val ? (
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="w-4 h-4 border-2 border-black border-t-transparent rounded-full mx-auto"
                            />
                        ) : (
                            val
                        )}
                    </button>
                ))}
             </div>
             
             <p className="text-[10px] text-textMuted italic">
                Finalizing will update the quest log and notify all members.
             </p>
        </div>
      )}
    </div>
  );
};
