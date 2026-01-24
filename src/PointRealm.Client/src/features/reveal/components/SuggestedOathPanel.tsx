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
    <div className={cn("flex flex-col gap-10", className)}>
      
      {/* Suggestion Section */}
      <AnimatePresence>
        {suggestion && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
            >
                <Panel variant="default" className="border-pr-primary/20 bg-pr-primary/[0.02] flex items-center justify-between p-6 relative overflow-hidden group shadow-glow-primary/5">
                    <div className="absolute -right-8 -top-8 text-pr-primary/[0.03] group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000 pointer-events-none">
                        <Sparkles size={160} />
                    </div>
                    
                    <div className="flex items-center gap-6 relative z-10 w-full">
                        <div className="w-16 h-20 rounded-xl bg-pr-bg border-2 border-pr-primary/40 flex items-center justify-center text-3xl font-black text-pr-primary shadow-glow-primary/20 transition-all duration-500 group-hover:border-pr-primary">
                            {suggestion.value}
                        </div>
                        <div className="flex-1 min-w-0">
                           <SectionHeader 
                             title="Suggested Oath" 
                             subtitle={`Forged by ${suggestion.kind === 'median' ? 'Steady Consensus' : 'Majority Voice'}`}
                             className="mb-0 [&_h2]:text-xl [&_p]:text-[10px]"
                           />
                        </div>

                        {isGM && (
                            <Button 
                                onClick={() => handleSeal(suggestion.value)}
                                variant="primary"
                                disabled={!!sealingValue}
                                className="hidden md:flex px-8 h-12 shadow-glow-primary/20 hover:shadow-glow-primary/40"
                            >
                                {sealingValue === suggestion.value ? 'Sealing...' : 'Seal Path'}
                            </Button>
                        )}
                    </div>
                </Panel>
            </motion.div>
        )}
      </AnimatePresence>

      {/* GM Controls Zone (Vantablack/Authority Style) */}
      {isGM && (
        <Panel className="border-l-4 border-l-pr-secondary relative overflow-hidden bg-pr-secondary/[0.01] border-pr-secondary/10 shadow-glow-secondary/5">
             <div className="flex items-center justify-between mb-8">
                 <SectionHeader 
                    title="Seal the Prophecy" 
                    subtitle="Finalize the outcome with Council Authority" 
                    className="mb-0 [&_h2]:text-pr-secondary [&_h2]:text-xl [&_p]:text-[10px]"
                 />
                 <Crown className="text-pr-secondary/40 animate-pulse" size={24} />
             </div>
             
             <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 mb-10">
                {deckValues.map(val => (
                    <motion.button
                        key={val}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSeal(val)}
                        disabled={!!sealingValue}
                        className={cn(
                            "h-12 rounded-lg border-2 text-[11px] font-black transition-all uppercase tracking-widest relative overflow-hidden group",
                            sealingValue === val 
                               ? "bg-pr-secondary border-pr-secondary text-pr-bg shadow-glow-secondary/40"
                               : "bg-pr-bg border-pr-border/20 text-pr-text/60 hover:border-pr-secondary/50 hover:text-pr-secondary hover:bg-pr-secondary/5"
                        )}
                        aria-label={`Seal as ${val}`}
                    >
                        {sealingValue === val ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="flex justify-center">
                                <div className="w-5 h-5 border-2 border-pr-bg border-t-transparent rounded-full" />
                            </motion.div>
                        ) : (
                            <>
                                <span className="relative z-10">{val}</span>
                                <div className="absolute inset-0 bg-gradient-to-t from-pr-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </>
                        )}
                    </motion.button>
                ))}
             </div>
             
             <div className="flex items-start gap-4 p-4 rounded-xl bg-pr-bg/60 border border-pr-border/10">
                 <div className="w-10 h-10 rounded-lg bg-pr-secondary/5 border border-pr-secondary/20 flex items-center justify-center text-pr-secondary/60 shrink-0">
                    <Sword size={18} />
                 </div>
                 <div>
                    <strong className="block text-[8px] font-black uppercase tracking-[0.2em] text-pr-secondary/80 mb-1">Final Manifestation</strong>
                    <p className="text-[10px] text-pr-text-muted/60 font-medium leading-relaxed italic">
                        By sealing this rune, you conclude the current encounter. The quest log will be permanently inscribed and the party shall prepare for the next ordeal.
                    </p>
                 </div>
             </div>
        </Panel>
      )}
    </div>
  );
};
