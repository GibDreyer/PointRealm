import { Encounter, Quest, RealmSettings, RealmStateDto } from '../../../types/realm';
import { ExternalLink, Sword, Quote } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ProphecyReveal } from '../../reveal/ProphecyReveal';
import { RuneCard } from './RuneCard';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeader } from '../../../components/ui/SectionHeader';

interface EncounterPanelProps {
    quest: Quest | null;
    encounter: Encounter | null;
    settings: RealmSettings;
    partyRoster: RealmStateDto['partyRoster']; 
    isGM: boolean;
    canVote: boolean;
    myVote?: string | null;
    onVote: (value: string) => void;
    onStartEncounter: (questId: string) => void;
}

export function EncounterPanel({ quest, encounter, settings, partyRoster, isGM, canVote, myVote, onVote }: EncounterPanelProps) {
    if (!quest) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-pr-bg/50">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md p-10 rounded-[var(--pr-radius-xl)] border border-pr-border/30 bg-pr-surface-dim/40 backdrop-blur-sm relative"
                >
                    <div className="absolute inset-0 bg-pr-primary/5 rounded-[var(--pr-radius-xl)] blur-3xl -z-10" />
                    <Sword className="w-12 h-12 text-pr-primary/20 mx-auto mb-6" />
                    <SectionHeader 
                        title="The Realm is Quiet" 
                        subtitle={isGM ? "Select a quest from the log to begin an encounter." : "Wait for the Game Master to initiate the ordeal."}
                        align="center"
                    />
                </motion.div>
            </div>
        );
    }

    const getDeckValues = (s: RealmSettings) => {
        if (s.deckType === 'fibonacci') return ['1', '2', '3', '5', '8', '13', '21', '?', 'coffee'];
        if (s.deckType === 'tshirt') return ['XS', 'S', 'M', 'L', 'XL', '?', 'coffee'];
        if (s.deckType === 'custom' && s.customDeckValues) return s.customDeckValues;
        return ['1', '2', '3', '5', '8', '13', '?', 'coffee'];
    };
    const deckValues = getDeckValues(settings);

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 space-y-12">
                    
                    {/* Header Zone */}
                    <AnimatePresence mode="wait">
                        {!encounter?.isRevealed && (
                            <motion.header 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
                                className="space-y-6 text-center"
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pr-primary/10 border border-pr-primary/20 text-pr-primary text-[10px] font-black uppercase tracking-[0.2em]">
                                    Active Quest
                                </div>
                                
                                <h1 className="text-4xl md:text-6xl font-black text-pr-text leading-tight tracking-tighter" style={{ fontFamily: 'var(--pr-heading-font)' }}>
                                    {quest.title}
                                </h1>

                                {quest.description && (
                                    <div className="relative max-w-2xl mx-auto py-4">
                                        <Quote className="absolute -left-8 -top-2 w-6 h-6 text-pr-primary/10" />
                                        <p className="text-lg md:text-xl text-pr-text-muted font-medium leading-relaxed italic">
                                            {quest.description}
                                        </p>
                                    </div>
                                )}

                                {quest.externalUrl && (
                                    <a 
                                        href={quest.externalUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="inline-flex items-center gap-2 text-xs font-bold text-pr-primary hover:text-pr-primary/80 transition-colors uppercase tracking-widest border-b border-pr-primary/30 pb-1"
                                    >
                                        <ExternalLink size={14} />
                                        Inscribe Details
                                    </a>
                                )}
                            </motion.header>
                        )}
                    </AnimatePresence>

                    {/* Ritual Area (Voting or Reveal) */}
                    <div className={cn("transition-all duration-700 ease-in-out", encounter?.isRevealed ? "h-full" : "mt-4")}>
                        {encounter?.isRevealed ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="min-h-[500px]"
                            >
                                <ProphecyReveal 
                                    encounter={encounter}
                                    partyRoster={partyRoster.members}
                                    isGM={isGM}
                                    deckValues={deckValues}
                                    onSealOutcome={async (val) => {
                                        // TODO: This should be passed down as an action
                                        console.log("Sealing outcome:", val);
                                    }}
                                    hideVoteCounts={settings.hideVoteCounts}
                                />
                            </motion.div>
                        ) : (
                            <div className="space-y-12">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-center max-w-4xl mx-auto">
                                    {deckValues.map((val: string, idx: number) => (
                                        <motion.div
                                            key={val}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <RuneCard 
                                                value={val}
                                                isSelected={myVote === val}
                                                disabled={!canVote}
                                                onClick={() => onVote(val)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                                
                                <AnimatePresence>
                                    {!canVote && !isGM && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center"
                                        >
                                            <span className="text-xs uppercase tracking-[0.3em] font-black text-pr-text-muted animate-pulse">
                                                “Deliberating with the Council...”
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
