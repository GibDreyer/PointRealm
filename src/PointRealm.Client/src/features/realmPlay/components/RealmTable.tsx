
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Encounter, PartyMember, Quest } from '../../../types/realm';
import { PlayerSeat } from './PlayerSeat';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/Button';
import { RefreshCcw, Eye, ChartBar } from 'lucide-react';
import { ProphecyReveal } from '../../reveal/ProphecyReveal';
import { Dialog } from '../../../components/ui/Dialog';
import { useProphecyStats } from '../../reveal/utils/statsHooks';
import { Panel } from '../../../components/ui/Panel';

interface RealmTableProps {
    quest: Quest | null;
    encounter: Encounter | null;
    members: PartyMember[];
    isGM: boolean;
    onReveal: () => void;
    onReroll: () => void;
    onSealOutcome: (value: string) => Promise<void>;
    onStartNextQuest: () => void;
    deckValues: string[];
    hideVoteCounts: boolean;
    actionsDisabled?: boolean;
    className?: string;
    realmCode?: string; // Add realm code for copy link feature
}
export function RealmTable({ 
    quest, 
    encounter, 
    members, 
    isGM, 
    onReveal, 
    onReroll, 
    onSealOutcome, 
    onStartNextQuest,
    deckValues,
    hideVoteCounts,
    actionsDisabled = false,
    className 
}: RealmTableProps) {
    const voters = members.filter(m => !m.isObserver && !m.isBanned);
    const votersCount = voters.length;
    const total = members.length;
    
    const topRow = members.slice(0, Math.ceil(total/2));
    const bottomRow = members.slice(Math.ceil(total/2));

    const isCrowded = total > 6;
    const isVeryCrowded = total > 12;

    const gapClass = isVeryCrowded ? "gap-2 sm:gap-4" : isCrowded ? "gap-4 sm:gap-6" : "gap-8 sm:gap-10";
    const tableAspectClass = isVeryCrowded ? "aspect-[4/1] sm:aspect-[6/1]" : isCrowded ? "aspect-[3/1] sm:aspect-[4/1]" : "aspect-[2/1] sm:aspect-[3/1]";

    const isRevealed = encounter?.isRevealed ?? false;
    const votes = encounter?.votes || {};
    const hasVoted = encounter?.hasVoted || {};
    const hasVotedCount = Object.values(hasVoted).filter(Boolean).length;
    const voteCount = hasVotedCount > 0 ? hasVotedCount : Object.keys(votes).length;
    const readyCount = hasVotedCount > 0
        ? hasVotedCount
        : voters.filter(m => m.status === 'ready').length;


    const { stats, consensusText, consensusColor } = useProphecyStats(
        encounter || { isRevealed: false, votes: {}, questId: '', distribution: {} }, 
        members, 
        deckValues
    );

    const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);

    return (
        <div className={cn("relative flex flex-col items-center justify-center min-h-[400px] w-full max-w-6xl mx-auto p-4 transition-all duration-700", className)}>
            
            {/* Top Row Seats */}
            <div className={cn("flex flex-wrap justify-center w-full", gapClass, isCrowded ? "mb-4 sm:mb-6" : "mb-8 sm:mb-12")}>
                {topRow.map(member => (
                    <PlayerSeat 
                        key={member.id} 
                        member={member} 
                        position="top"
                        isRevealed={isRevealed}
                        vote={votes[member.id] || null}
                    />
                ))}
            </div>

            {/* The Table Surface */}
            <Panel 
                variant="realm"
                className={cn("relative w-full max-w-3xl flex items-center justify-center transition-all duration-500", tableAspectClass)}
            >
                 {/* Table Texture/Glow */}

                 
                 <div className="w-full flex h-full justify-between flex-col items-center gap-2 sm:gap-4 relative z-10 p-2 text-center">
                     {quest ? (
                         <>
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center gap-1 sm:gap-2 max-w-5xl mx-auto text-center"
                            >
                                <h2 className={cn(
                                    "font-serif font-bold text-pr-primary brightness-110 leading-tight shrink-0",
                                    isCrowded ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
                                )}>
                                    {quest.title}
                                </h2>
                                {quest.description && (
                                    <p className={cn(
                                        "text-pr-text-muted max-w-md sm:max-w-lg mx-auto line-clamp-2 sm:line-clamp-3",
                                        isCrowded ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"
                                    )}>
                                        {quest.description}
                                    </p>
                                )}
                            </motion.div>

                             {!isRevealed ? (
                                <>
                                    <div className="flex items-center gap-4 mt-1 sm:mt-2">
                                        <div className="px-3 py-1 rounded-full bg-black/20 border border-pr-primary/10 text-[9px] sm:text-xs uppercase tracking-widest text-pr-text-muted">
                                            {readyCount}/{votersCount} Votes Cast
                                        </div>
                                    </div>

                                    {isGM && (
                                        <div className="flex gap-4 mt-2 sm:mt-4">
                                            {members.length <= 1 ? (
                                                <div className="text-pr-text-muted italic opacity-70 border border-pr-border/30 bg-pr-surface/30 px-6 py-2 rounded-xl text-[10px] sm:text-sm">
                                                    It's lonely here among the echoes... Waiting for a party.
                                                </div>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={onReroll}
                                                        disabled={voteCount === 0 || actionsDisabled}
                                                        className={cn("px-6 sm:px-10 py-2 sm:py-5 min-h-0", isCrowded ? "h-10 sm:h-12 text-sm" : "h-14 text-lg")}
                                                    >
                                                        <RefreshCcw size={isCrowded ? 14 : 18} className="mr-2 sm:mr-3" />
                                                        Reroll
                                                    </Button>
                                                    <Button
                                                        onClick={onReveal}
                                                        disabled={voteCount === 0 || actionsDisabled}
                                                        className={cn("px-6 sm:px-10 py-2 sm:py-5 min-h-0", isCrowded ? "h-10 sm:h-12 text-sm" : "h-14 text-lg")}
                                                    >
                                                        <Eye size={isCrowded ? 14 : 18} className="mr-2 sm:mr-3" />
                                                        Reveal Cards
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>

                             ) : (
                                    <div className="w-full  flex flex-col items-center gap-2 sm:gap-4 animate-in fade-in zoom-in duration-1000">
                                       <div className="flex flex-row items-center gap-3 sm:gap-4 w-full max-w-xl px-4">
                                           {/* Consensus Block - 2/3 width */}
                                           <div className={cn("relative group flex-[2]", isCrowded ? "h-16 sm:h-20" : "h-20 sm:h-24")}>
                                                <div className="absolute inset-0 bg-pr-surface-slate/40 border border-pr-border/30 rounded-xl backdrop-blur-md shadow-lg transition-all duration-500 group-hover:border-pr-primary/30 group-hover:bg-pr-surface-slate/60" />
                                                <div className="relative flex flex-col items-center justify-center h-full p-1 sm:p-2">
                                                    <span className="text-[7px] sm:text-[8px] uppercase tracking-[0.3em] text-pr-text-dim mb-0.5 sm:mb-1 font-heading opacity-50">Consensus</span>
                                                    <div className={cn(
                                                        "font-serif font-black uppercase tracking-widest leading-tight text-center px-1", 
                                                        consensusColor,
                                                        isCrowded ? "text-sm sm:text-lg" : "text-lg sm:text-xl"
                                                    )}>
                                                        {consensusText}
                                                    </div>
                                                    <div className="absolute -top-px left-1/2 -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-pr-border/30 to-transparent" />
                                                    <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-12 h-px bg-gradient-to-r from-transparent via-pr-border/30 to-transparent" />
                                                </div>
                                           </div>
    
                                           {/* Average Block - 1/3 width */}
                                           <div className={cn("relative group flex-1", isCrowded ? "h-16 sm:h-20" : "h-20 sm:h-24")}>
                                                <div className="absolute inset-0 bg-pr-primary/5 border border-pr-primary/20 rounded-xl backdrop-blur-md shadow-md transition-all duration-500 group-hover:border-pr-primary/40 group-hover:bg-pr-primary/10" />
                                                <div className="relative flex flex-col items-center justify-center h-full p-1 sm:p-2">
                                                    <span className="text-[7px] sm:text-[8px] uppercase tracking-[0.3em] text-pr-primary/40 mb-0.5 sm:mb-1 font-heading">Average</span>
                                                    <div className={cn(
                                                        "font-black text-pr-primary tracking-tighter drop-shadow-glow leading-none",
                                                        isCrowded ? "text-xl sm:text-3xl" : "text-3xl"
                                                    )}>
                                                        {stats?.average ?? "?"}
                                                    </div>
                                                    <div className="mt-1 w-4 h-0.5 bg-pr-primary/20 rounded-full" />
                                                </div>
                                           </div>
                                       </div>
    
                                        <div className="w-full flex items-center gap-4 mt-0.5 sm:mt-1" style={{justifyContent: "space-between"}}>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setIsRevealModalOpen(true)}
                                                className="px-3 sm:px-5 py-1 sm:py-1.5 text-[8px] sm:text-[9px] min-h-0 border border-white/10 hover:border-pr-primary/30 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-lg transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <ChartBar size={10} className="text-pr-primary opacity-60" />
                                                    <span className="font-heading font-bold uppercase tracking-[0.2em]">Analysis</span>
                                                </div>
                                            </Button>
   
                                            {isGM && (
                                                <Button
                                                    variant="secondary"
                                                    onClick={onStartNextQuest}
                                                    disabled={actionsDisabled}
                                                    className="px-4 sm:px-6 py-1 sm:py-1.5 text-[9px] sm:text-[10px] min-h-0 h-6 sm:h-8 border-pr-secondary/30 hover:border-pr-secondary/60 transition-all duration-500"
                                                >
                                                    Next Quest
                                                </Button>
                                            )}
                                     </div>
                                 </div>
                             )}
                         </>
                     ) : (
                         <div className="text-pr-text-muted italic opacity-50 tracking-[0.2em] uppercase text-[9px] sm:text-[10px]">
                             Waiting for destiny...
                         </div>
                     )}
                 </div>
 

            </Panel>

            {/* Bottom Row Seats */}
            <div className={cn("flex flex-wrap justify-center w-full", gapClass, isCrowded ? "mt-4 sm:mt-6" : "mt-8 sm:mt-12")}>
                {bottomRow.map(member => (
                     <PlayerSeat 
                        key={member.id} 
                        member={member} 
                        position="bottom"
                        isRevealed={isRevealed}
                        vote={votes[member.id] || null}
                     />
                ))}
            </div>

            {/* Reveal Modal - With fully custom transparency so we use Panel(variant=realm) */}
            <Dialog 
                isOpen={isRevealModalOpen} 
                onClose={() => setIsRevealModalOpen(false)}
                className="max-w-4xl bg-transparent border-none shadow-none overflow-visible"
                contentClassName="p-0"
                showCloseData={true}
            >
                {encounter && (
                    <ProphecyReveal 
                        encounter={encounter}
                        partyRoster={members}
                        isGM={isGM}
                        deckValues={deckValues}
                        quest={quest!}
                        onSealOutcome={onSealOutcome}
                        onReroll={onReroll}
                        onStartNextQuest={onStartNextQuest}
                        hideVoteCounts={hideVoteCounts}
                        minimal
                        panelVariant="realm"
                        actionsDisabled={actionsDisabled}
                    />
                )}
            </Dialog>

        </div>
    );
}
