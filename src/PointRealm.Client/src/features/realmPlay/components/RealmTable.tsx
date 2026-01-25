
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Encounter, PartyMember, Quest } from '../../../types/realm';
import { PlayerSeat } from './PlayerSeat';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/Button';
import { RefreshCcw, Eye, ChartBar } from 'lucide-react';
import { ProphecyReveal } from '../../reveal/ProphecyReveal';
import { Dialog } from '../../../components/ui/Dialog';

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
    className?: string;
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
    const readyCount = members.filter(m => m.status === 'ready').length;

    const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);

    // Sync modal state with reveal state
    useEffect(() => {
        if (isRevealed) {
            setIsRevealModalOpen(true);
        } else {
            setIsRevealModalOpen(false);
        }
    }, [isRevealed]);

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
            <div className="relative w-full max-w-3xl aspect-[2/1] sm:aspect-[3/1] bg-pr-surface/40 rounded-3xl border border-pr-primary/20 backdrop-blur-sm shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-500">
                 {/* Table Texture/Glow */}
                 <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                 <div className="absolute inset-0 bg-[url('/patterns/subtle-noise.png')] opacity-10 pointer-events-none" />
                 
                 <div className="flex flex-col items-center gap-4 relative z-10 p-6 text-center">
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

                            <div className="flex items-center gap-4 mt-2">
                                <div className="px-4 py-1.5 rounded-full bg-black/20 border border-pr-primary/10 text-xs uppercase tracking-widest text-pr-text-muted">
                                    {readyCount}/{total} Votes Cast
                                </div>
                            </div>

                            {isGM && !isRevealed && (
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={onReroll}
                                        disabled={readyCount === 0}
                                    >
                                        <RefreshCcw size={14} className="mr-2" />
                                        Reroll
                                    </Button>
                                    <Button
                                        onClick={onReveal}
                                        disabled={readyCount === 0}
                                        className="bg-pr-primary text-pr-bg hover:bg-pr-primary/90"
                                    >
                                        <Eye size={14} className="mr-2" />
                                        Reveal Cards
                                    </Button>
                                </div>
                            )}

                            {isRevealed && (
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsRevealModalOpen(true)}
                                        className="border-pr-primary/50 text-pr-primary hover:bg-pr-primary/10"
                                    >
                                        <ChartBar size={14} className="mr-2" />
                                        View Results
                                    </Button>
                                </div>
                            )}
                         </>
                     ) : (
                         <div className="text-pr-text-muted italic">
                             Waiting for quests...
                         </div>
                     )}
                 </div>
            </div>

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
                className="bg-transparent border-none shadow-none p-0 max-w-4xl overflow-visible"
                contentClassName="p-0"
                showCloseData={false}
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
                    />
                )}
            </Dialog>

        </div>
    );
}
