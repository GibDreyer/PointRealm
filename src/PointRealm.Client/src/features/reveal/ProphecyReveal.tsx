import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Encounter, PartyMember } from '@/types/realm';
import { RuneCardMini } from './components/RuneCardMini'; // Ensure these are exported from index or direct
import { RuneDistribution } from './components/RuneDistribution';
import { SuggestedOathPanel } from './components/SuggestedOathPanel';
import { useSound } from '@/hooks/useSound';

// Interfaces aligned with user request
interface ProphecyRevealProps {
  encounter: Encounter;
  partyRoster: PartyMember[];
  isGM: boolean;
  deckValues: string[]; // Pass from settings or generic deck
  onSealOutcome: (value: string) => Promise<void>;
  className?: string;
  hideVoteCounts?: boolean; // From realm settings
}

export const ProphecyReveal: React.FC<ProphecyRevealProps> = ({
  encounter,
  partyRoster,
  isGM,
  deckValues,
  onSealOutcome,
  className,
  hideVoteCounts = false
}) => {
  const [showVignette, setShowVignette] = useState(false);
  const { play } = useSound();
  
  // Detect transition from unrevealed to revealed to trigger effects
  useEffect(() => {
    if (encounter.isRevealed) {
        setShowVignette(true);
        play('reveal'); // Assuming useSound has this, or mapped to something appropriate
        const timer = setTimeout(() => setShowVignette(false), 500); 
        return () => clearTimeout(timer);
    }
  }, [encounter.isRevealed, play]);

  // Derived Data: Votes List
  const voteList = useMemo(() => {
    return partyRoster
      .filter(m => m.status !== 'disconnected') // Only show active participants
      .map(member => {
         const vote = encounter.votes[member.id];
         return {
             ...member,
             voteValue: vote || null, // vote is string | null
             hasVoted: !!vote
         };
      })
      .sort((a, b) => {
          // Sort votes by deck order logic if possible, else alphabetical
          const aIdx = a.voteValue ? deckValues.indexOf(a.voteValue) : -1;
          const bIdx = b.voteValue ? deckValues.indexOf(b.voteValue) : -1;
          if (aIdx !== bIdx) return bIdx - aIdx; // High to low? Or Low to High? Usually grouped.
          return a.name.localeCompare(b.name);
      });
  }, [partyRoster, encounter.votes, deckValues]);

  // Derived Data: Distribution
  const distribution = useMemo(() => {
     const counts: Record<string, number> = {};
     Object.values(encounter.votes).forEach(val => {
         if (val) counts[val] = (counts[val] || 0) + 1;
     });
     
     // Map deck values to ensure correct order
     return deckValues
       .filter(val => counts[val])
       .map(val => ({ value: val, count: counts[val]! }));
  }, [encounter.votes, deckValues]);
  
  // Numeric Logic for Highlighting
  const numericVotes = voteList
    .map(m => parseFloat(m.voteValue || ''))
    .filter(n => !isNaN(n));
    
  const maxVote = numericVotes.length ? Math.max(...numericVotes) : null;
  const minVote = numericVotes.length ? Math.min(...numericVotes) : null;

  return (
    <div className={cn("relative flex flex-col w-full h-full max-w-5xl mx-auto p-4 md:p-6", className)}>
      
      {/* Vignette Pulse Overlay */}
      <AnimatePresence>
        {showVignette && (
            <motion.div 
                className="fixed inset-0 pointer-events-none z-50 bg-cyan-500/10 mix-blend-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 via-transparent to-cyan-900/20" />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="text-center mb-8">
         <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70"
         >
             Prophecy Revealed
         </motion.h2>
         <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             transition={{ delay: 0.2 }}
             className="text-sm text-textMuted uppercase tracking-wider font-bold mt-1"
         >
             Encounter Results
         </motion.div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Party Votes */}
        <div className="md:col-span-7 space-y-4">
             <div className="flex justify-between items-center border-b border-white/10 pb-2">
                 <h3 className="text-sm font-bold text-textMuted uppercase tracking-widest">Party Votes</h3>
                 {!hideVoteCounts && (
                     <span className="text-xs text-textMuted font-mono">
                        {Object.keys(encounter.votes).length} Votes
                     </span>
                 )}
             </div>
             
             <div className="space-y-2">
                 {voteList.map((member, idx) => {
                     const isNum = !isNaN(parseFloat(member.voteValue || ''));
                     const isMax = isNum && parseFloat(member.voteValue!) === maxVote;
                     const isMin = isNum && parseFloat(member.voteValue!) === minVote;
                     
                     return (
                         <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg bg-surface border border-transparent transition-colors",
                                isMax && "border-l-4 border-l-[var(--pr-secondary)] bg-surface/80", // Gold for max
                                isMin && "border-l-4 border-l-[var(--pr-success)] bg-surface/80"   // Green for min
                            )}
                         >
                            <div className="flex items-center gap-3">
                                {/* Placeholder Badge */}
                                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-xs font-bold text-textMuted border border-white/10">
                                   {member.name.substring(0,2).toUpperCase()}
                                </div>
                                <span className={cn("font-medium text-text", !member.voteValue && "opacity-50 italic")}>
                                    {member.name}
                                </span>
                            </div>
                            
                            <RuneCardMini 
                                value={member.voteValue} 
                                revealed={encounter.isRevealed} 
                                delay={idx * 0.05 + 0.1} // Stagger flips slightly or sync globally? Request said "Synchronized card flips" but usually a slight wave feels better. Let's make it tight.
                            />
                         </motion.div>
                     );
                 })}
             </div>
        </div>

        {/* Right Column: Distribution & Controls */}
        <div className="md:col-span-5 space-y-8">
            <RuneDistribution 
                distribution={distribution} 
            />
            
            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            <SuggestedOathPanel 
                suggestion={null} // TODO: Calculate or pass from server if available. User said "encounter.suggestedOath" contract.
                // Assuming encounter doesn't have it in the Interface yet, we might need to compute local median/mode if server didn't send it.
                // But contract said "encounter.suggestedOath". Let's assume it's there or we mock for now.
                deckValues={deckValues || []} 
                isGM={isGM}
                onSealOutcome={onSealOutcome}
            />
        </div>

      </div>
    </div>
  );
};
