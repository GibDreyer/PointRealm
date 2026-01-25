
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Encounter, PartyMember, Quest } from '../../../types/realm';
import { PlayerSeat } from './PlayerSeat';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/Button';
import { RefreshCcw, Eye, ChartBar, Link2, Check } from 'lucide-react';
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
    deckValues,
    hideVoteCounts,
    actionsDisabled = false,
    className 
}: RealmTableProps) {
    // We need to distribute members around the table
    // Simplest approach: Top, Bottom, Left, Right
    // But table is in center. bottom is reserved for "me" (the user) usually in poker apps, but here RuneHand is there.
    // So "Me" shouldn't necessarily be on the table visual if I have my hand below?
    // Actually, in the reference image, the user IS at the table essentially (or the camera is looking at the table).
    // Let's seat everyone around the rect.
    
    // Sort members to put current user at bottom? Or just stable sort.
    // The reference image has avatars floating around a central rect.
    
    // Let's Split members into groups for positioning
    const total = members.length;
    
    // Actually, let's do Top/Bottom/Left/Right for better spread if many users
    // For now, simpler top/bottom rows or circular distribution?
    // Rectangular table suggests top/bottom/sides.
    
    const topRow = members.slice(0, Math.ceil(total/2));
    const bottomRow = members.slice(Math.ceil(total/2));

    const isRevealed = encounter?.isRevealed ?? false;
    const votes = encounter?.votes || {};
    const voteCount = Object.keys(votes).length; // Use explicit vote count from encounter
    const readyCount = members.filter(m => m.status === 'ready').length;


    const { stats, consensusText, consensusColor } = useProphecyStats(
        encounter || { isRevealed: false, votes: {}, questId: '', distribution: {} }, 
        members, 
        deckValues
    );

    const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);

    return (
        <div className={cn("relative flex flex-col items-center justify-center min-h-[400px] w-full max-w-5xl mx-auto p-4", className)}>
            
            {/* Top Row Seats */}
            <div className="flex justify-center gap-8 mb-8 sm:mb-12 w-full">
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
                className="relative w-full max-w-3xl aspect-[2/1] sm:aspect-[3/1] flex items-center justify-center transition-all duration-500"
            >
                 {/* Table Texture/Glow */}

                 
                 <div className="w-full flex flex-col items-center gap-4 relative z-10 p-1 text-center">
                     {quest ? (
                         <>
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-1"
                            >
                                <h2 className="text-xl sm:text-2xl font-serif font-bold text-pr-primary brightness-110">
                                    {quest.title}
                                </h2>
                                {quest.description && (
                                    <p className="text-sm text-pr-text-muted max-w-md mx-auto line-clamp-2">
                                        {quest.description}
                                    </p>
                                )}
                            </motion.div>

                             {!isRevealed ? (
                                <>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="px-4 py-1.5 rounded-full bg-black/20 border border-pr-primary/10 text-xs uppercase tracking-widest text-pr-text-muted">
                                            {readyCount}/{total} Votes Cast
                                        </div>
                                    </div>

                                    {isGM && (
                                        <div className="flex gap-4 mt-4">
                                            {members.length <= 1 ? (
                                                <div className="text-pr-text-muted italic opacity-70 border border-pr-border/30 bg-pr-surface/30 px-6 py-3 rounded-xl text-sm">
                                                    It's lonely here among the echoes... Waiting for a party.
                                                </div>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={onReroll}
                                                        disabled={voteCount === 0 || actionsDisabled}
                                                        className="px-10 py-5 text-lg min-h-0 h-14"
                                                    >
                                                        <RefreshCcw size={18} className="mr-3" />
                                                        Reroll
                                                    </Button>
                                                    <Button
                                                        onClick={onReveal}
                                                        disabled={voteCount === 0 || actionsDisabled}
                                                        className="px-10 py-5 text-lg min-h-0 h-14"
                                                    >
                                                        <Eye size={18} className="mr-3" />
                                                        Reveal Cards
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </>

                             ) : (
                                 <div className="w-full  flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-1000">
                                    <div className="flex flex-row items-center gap-6 w-full max-w-2xl px-4">
                                        {/* Consensus Block - 2/3 width */}
                                        <div className="relative group flex-[2] h-27">
                                             <div className="absolute inset-0 bg-pr-surface-slate/40 border border-pr-border/30 rounded-xl backdrop-blur-md shadow-lg transition-all duration-500 group-hover:border-pr-primary/30 group-hover:bg-pr-surface-slate/60" />
                                             <div className="relative flex flex-col items-center justify-center h-full p-3">
                                                 <span className="text-[9px] uppercase tracking-[0.3em] text-pr-text-dim mb-2 font-heading opacity-50">Consensus</span>
                                                 <div className={cn("text-xl font-serif font-black uppercase tracking-widest leading-tight text-center px-1", consensusColor)}>
                                                     {consensusText}
                                                 </div>
                                                 <div className="absolute -top-px left-1/2 -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-pr-border/30 to-transparent" />
                                                 <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-16 h-px bg-gradient-to-r from-transparent via-pr-border/30 to-transparent" />
                                             </div>
                                        </div>
 
                                        {/* Average Block - 1/3 width */}
                                        <div className="relative group flex-1 h-27">
                                             <div className="absolute inset-0 bg-pr-primary/5 border border-pr-primary/20 rounded-xl backdrop-blur-md shadow-md transition-all duration-500 group-hover:border-pr-primary/40 group-hover:bg-pr-primary/10" />
                                             <div className="relative flex flex-col items-center justify-center h-full p-3">
                                                 <span className="text-[9px] uppercase tracking-[0.3em] text-pr-primary/40 mb-1.5 font-heading">Average</span>
                                                 <div className="text-4xl font-black text-pr-primary tracking-tighter drop-shadow-glow leading-none">
                                                     {stats?.average ?? "?"}
                                                 </div>
                                                 <div className="mt-2 w-6 h-0.5 bg-pr-primary/20 rounded-full" />
                                             </div>
                                        </div>
                                    </div>
 
                                     <div className="w-full flex items-center gap-4 mt-2" style={{justifyContent: "space-between"}}>
                                         <Button
                                             variant="ghost"
                                             onClick={() => setIsRevealModalOpen(true)}
                                             className="px-6 py-2 text-[10px] min-h-0  border border-white/10 hover:border-pr-primary/30 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-xl transition-all duration-300"
                                         >
                                             <div className="flex items-center gap-2">
                                                 <ChartBar size={14} className="text-pr-primary opacity-60" />
                                                 <span className="font-heading font-bold uppercase tracking-[0.2em]">Analysis</span>
                                             </div>
                                         </Button>

                                         {isGM && (
                                             <Button
                                                 variant="secondary"
                                                 onClick={onReroll}
                                                 disabled={actionsDisabled}
                                                 className="px-10 py-2 text-xs min-h-0 h-10 border-pr-secondary/30 hover:border-pr-secondary/60 transition-all duration-500"
                                             >
                                                 <RefreshCcw size={14} className="mr-3 opacity-70" />
                                                 Reroll Fates
                                             </Button>
                                         )}
                                     </div>
                                 </div>
                             )}
                         </>
                     ) : (
                         <div className="text-pr-text-muted italic opacity-50 tracking-[0.2em] uppercase text-[10px]">
                             Waiting for destiny...
                         </div>
                     )}
                 </div>
 

            </Panel>

            {/* Bottom Row Seats */}
            <div className="flex justify-center gap-8 mt-8 sm:mt-12 w-full">
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
