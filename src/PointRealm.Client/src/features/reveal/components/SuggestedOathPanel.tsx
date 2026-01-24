import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sword, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Panel } from '@/components/ui/Panel';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/Button';

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
    if (sealingValue) return; 
    setSealingValue(val);
    try {
      await onSealOutcome(val);
    } catch (e) {
      console.error("Failed to seal", e);
      setSealingValue(null);
    }
  };

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      
      {/* Suggestion Section */}
      <AnimatePresence>
        {suggestion && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
            >
                <Panel variant="default" className="border-pr-primary/30 bg-pr-primary/5 flex items-center justify-between p-5 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-pr-primary/10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <Sparkles size={120} />
                    </div>
                    
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-20 rounded-xl bg-pr-surface border-2 border-pr-primary flex items-center justify-center text-3xl font-black text-pr-primary shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            {suggestion.value}
                        </div>
                        <div>
                           <SectionHeader 
                             title="Suggested Oath" 
                             subtitle={`A path formed by ${suggestion.kind === 'median' ? 'Steady Consensus' : 'Majority Voice'}`}
                             className="mb-0"
                           />
                        </div>
                    </div>

                    {isGM && (
                        <Button 
                            onClick={() => handleSeal(suggestion.value)}
                            variant="primary"
                            disabled={!!sealingValue}
                            className="hidden md:flex ml-4 px-6 h-12"
                        >
                            Accept Path
                        </Button>
                    )}
                </Panel>
            </motion.div>
        )}
      </AnimatePresence>

      {/* GM Controls Zone */}
      {isGM && (
        <Panel className="border-l-4 border-l-pr-secondary relative overflow-hidden bg-pr-secondary/[0.02]">
             <div className="flex items-center justify-between mb-4">
                 <SectionHeader 
                    title="Seal the Prophecy" 
                    subtitle="Finalize the outcome" 
                    className="mb-0 text-pr-secondary"
                 />
                 <Crown className="text-pr-secondary opacity-40" size={20} />
             </div>
             
             <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-6">
                {deckValues.map(val => (
                    <button
                        key={val}
                        onClick={() => handleSeal(val)}
                        disabled={!!sealingValue}
                        className={cn(
                            "h-10 rounded border text-xs font-black transition-all uppercase tracking-tighter shadow-sm",
                            sealingValue === val 
                               ? "bg-pr-secondary text-pr-bg border-pr-secondary shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                               : "bg-pr-surface border-pr-border/40 text-pr-text/80 hover:border-pr-secondary hover:text-pr-secondary"
                        )}
                        aria-label={`Seal as ${val}`}
                    >
                        {sealingValue === val ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="flex justify-center">
                                <div className="w-4 h-4 border-2 border-pr-bg border-t-transparent rounded-full" />
                            </motion.div>
                        ) : val}
                    </button>
                ))}
             </div>
             
             <div className="flex items-center gap-2 p-3 rounded-lg bg-pr-bg/40 border border-pr-border/20">
                 <div className="w-8 h-8 rounded-full bg-pr-secondary/10 flex items-center justify-center text-pr-secondary">
                    <Sword size={16} />
                 </div>
                 <p className="text-[10px] text-pr-text-muted font-bold uppercase tracking-tight italic">
                    Finalizing will update the quest log and notify all travelers of the fate agreed upon.
                 </p>
             </div>
        </Panel>
      )}
    </div>
  );
};
