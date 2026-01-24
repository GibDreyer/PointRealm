import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Encounter, PartyMember } from '@/types/realm';
import { RuneCardMini } from './components/RuneCardMini'; 
import { RuneDistribution } from './components/RuneDistribution';
import { SuggestedOathPanel } from './components/SuggestedOathPanel';
import { useSound } from '@/hooks/useSound';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Panel } from '@/components/ui/Panel';

interface ProphecyRevealProps {
  encounter: Encounter;
  partyRoster: PartyMember[];
  isGM: boolean;
  deckValues: string[];
  onSealOutcome: (value: string) => Promise<void>;
  className?: string;
  hideVoteCounts?: boolean; 
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
  
  useEffect(() => {
    if (encounter.isRevealed) {
        setShowVignette(true);
        play('reveal'); 
        const timer = setTimeout(() => setShowVignette(false), 800); 
        return () => clearTimeout(timer);
    }
  }, [encounter.isRevealed, play]);

  const voteList = useMemo(() => {
    return partyRoster
      .filter(m => m.status !== 'disconnected')
      .map(member => {
         const vote = encounter.votes[member.id];
         return {
             ...member,
             voteValue: vote || null,
             hasVoted: !!vote
         };
      })
      .sort((a, b) => {
          const aIdx = a.voteValue ? deckValues.indexOf(a.voteValue) : -1;
          const bIdx = b.voteValue ? deckValues.indexOf(b.voteValue) : -1;
          if (aIdx !== bIdx) return bIdx - aIdx;
          return a.name.localeCompare(b.name);
      });
  }, [partyRoster, encounter.votes, deckValues]);

  const distribution = useMemo(() => {
     const counts: Record<string, number> = {};
     Object.values(encounter.votes).forEach(val => {
         if (val) counts[val] = (counts[val] || 0) + 1;
     });
     
     return deckValues
       .filter(val => counts[val])
       .map(val => ({ value: val, count: counts[val]! }));
  }, [encounter.votes, deckValues]);
  
  const numericVotes = voteList
    .map(m => parseFloat(m.voteValue || ''))
    .filter(n => !isNaN(n));
    
  const maxVote = numericVotes.length ? Math.max(...numericVotes) : null;
  const minVote = numericVotes.length ? Math.min(...numericVotes) : null;

  return (
    <div className={cn("relative flex flex-col w-full h-full max-w-6xl mx-auto ", className)}>
      
      {/* Vignette Pulse Overlay */}
      <AnimatePresence>
        {showVignette && (
            <motion.div 
                className="fixed inset-0 pointer-events-none z-[60] bg-pr-primary/10 mix-blend-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(6,182,212,0.3)]" />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
             <SectionHeader 
                title="Prophecy Revealed" 
                subtitle="The Council has Spoken" 
                align="center"
             />
          </motion.div>
      </header>

      {/* Main Grid: Responsive 1 or 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Left/Main Column: Party Votes */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
             <div className="flex items-center justify-between border-b border-pr-border/20 pb-4">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-pr-primary/60 italic flex items-center gap-3">
                     <span className="w-1 h-1 rounded-full bg-pr-primary/40" />
                     Traveler Intent
                 </h3>
                 {!hideVoteCounts && (
                     <span className="text-[9px] text-pr-text-muted/40 font-black uppercase tracking-[0.2em] italic">
                        {Object.keys(encounter.votes).length} Sigils Manifested
                     </span>
                 )}
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                 {voteList.map((member, idx) => {
                     const isNum = !isNaN(parseFloat(member.voteValue || ''));
                     const isMax = isNum && parseFloat(member.voteValue!) === maxVote;
                     const isMin = isNum && parseFloat(member.voteValue!) === minVote;
                     
                     return (
                         <motion.div
                            key={member.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 + 0.1, duration: 0.5 }}
                            className="group"
                         >
                            <Panel 
                                variant="subtle" 
                                noPadding
                                className={cn(
                                    "flex items-center justify-between p-4 transition-all duration-500 border-pr-border/20",
                                    isMax ? "border-pr-secondary/30 bg-pr-secondary/[0.02] shadow-glow-secondary/5" : 
                                    isMin ? "border-pr-primary/30 bg-pr-primary/[0.02] shadow-glow-primary/5" :
                                    "bg-pr-surface/40 hover:border-pr-border/40 hover:bg-pr-surface/60"
                                )}
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 transition-all duration-500 border",
                                        isMax ? "bg-pr-secondary/5 border-pr-secondary/40 text-pr-secondary" : 
                                        isMin ? "bg-pr-primary/5 border-pr-primary/40 text-pr-primary" : 
                                        "bg-pr-bg border-pr-border/30 text-pr-text-muted/60"
                                    )}>
                                       {member.name.substring(0,2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={cn(
                                            "text-xs font-black uppercase tracking-widest truncate transition-colors duration-500", 
                                            !member.voteValue ? "text-pr-text-muted/30 italic" : "text-pr-text/80"
                                        )}>
                                            {member.name}
                                        </span>
                                        {isMax ? <span className="text-[8px] font-black uppercase text-pr-secondary/60 tracking-widest italic mt-0.5">Peak Value</span> :
                                         isMin ? <span className="text-[8px] font-black uppercase text-pr-primary/60 tracking-widest italic mt-0.5">Anchor Value</span> : null}
                                    </div>
                                </div>
                                
                                <RuneCardMini 
                                    value={member.voteValue} 
                                    revealed={encounter.isRevealed} 
                                    delay={idx * 0.05 + 0.3} 
                                />
                            </Panel>
                         </motion.div>
                     );
                 })}
             </div>
        </div>

        {/* Right Sidebar: Distribution & Summary */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-10">
            <RuneDistribution 
                distribution={distribution} 
            />
            
            <div className="h-px bg-gradient-to-r from-transparent via-pr-border/20 to-transparent" />
            
            <SuggestedOathPanel 
                suggestion={null} 
                deckValues={deckValues || []} 
                isGM={isGM}
                onSealOutcome={onSealOutcome}
            />
        </div>

      </div>
    </div>
  );
};
