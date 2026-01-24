import { Encounter, Quest, RealmSettings, RealmStateDto } from '../../../types/realm';
import { ExternalLink, Sword, Quote } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { ProphecyReveal } from '../../reveal/ProphecyReveal';
import { RuneCard } from './RuneCard';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Panel } from '../../../components/ui/Panel';

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
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-transparent">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full"
                >
                    <Panel variant="subtle" className="py-16 px-10 border-pr-primary/10 relative overflow-hidden group">
                        {/* Static Focal Glow inside the panel */}
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-pr-primary/30 to-transparent" />
                        
                        <div className="mb-8 relative">
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-pr-primary/5 rounded-full blur-xl group-hover:bg-pr-primary/10 transition-colors duration-700" />
                             <Sword className="w-14 h-14 text-pr-primary/20 mx-auto relative z-10" />
                        </div>

                        <SectionHeader 
                            title="Quiet Realm" 
                            subtitle={isGM ? "Select a quest from the log to begin an encounter." : "Wait for the Game Master to initiate the ordeal."}
                            align="center"
                        />
                    </Panel>
                </motion.div>
            </div>
        );
    }

    const getDeckValues = (s: RealmSettings) => {
        if (s.deckType === 'FIBONACCI') return ['1', '2', '3', '5', '8', '13', '21', '?', 'coffee'];
        if (s.deckType === 'TSHIRT') return ['XS', 'S', 'M', 'L', 'XL', '?', 'coffee'];
        if (s.deckType === 'CUSTOM' && s.customDeckValues) return s.customDeckValues;
        return ['1', '2', '3', '5', '8', '13', '?', 'coffee'];
    };
    const deckValues = getDeckValues(settings);

    return (
        <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto p-6 md:p-10 lg:p-14 space-y-16">
                    
                    {/* Header Zone */}
                    <AnimatePresence mode="wait">
                        {!encounter?.isRevealed && (
                            <motion.header 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20, height: 0, marginBottom: 0 }}
                                className="space-y-8 text-center"
                            >
                                <div className="inline-flex items-center gap-3 px-4 py-1 rounded-full bg-pr-primary/5 border border-pr-primary/10 text-pr-primary/60 text-[10px] font-black uppercase tracking-[0.3em] italic">
                                    <span className="w-1 h-1 rounded-full bg-pr-primary/40 animate-pulse" />
                                    Active Quest
                                </div>
                                
                                <h1 className="text-5xl md:text-7xl font-black text-pr-text leading-[1.1] tracking-tighter uppercase" style={{ fontFamily: 'var(--pr-heading-font)', textShadow: '0 0 30px rgba(6, 182, 212, 0.2)' }}>
                                    {quest.title}
                                </h1>

                                {quest.description && (
                                    <div className="relative max-w-2xl mx-auto">
                                        <Quote className="absolute -left-10 -top-4 w-8 h-8 text-pr-primary/5" />
                                        <p className="text-xl md:text-2xl text-pr-text-muted/80 font-bold leading-relaxed italic">
                                            {quest.description}
                                        </p>
                                    </div>
                                )}

                                {quest.externalUrl && (
                                    <div className="pt-4">
                                        <a 
                                            href={quest.externalUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="group inline-flex items-center gap-2 text-[10px] font-black text-pr-primary/60 hover:text-pr-primary transition-all uppercase tracking-[0.2em] border-b border-pr-primary/20 pb-1"
                                        >
                                            <ExternalLink size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                            Inspect Reference
                                        </a>
                                    </div>
                                )}
                            </motion.header>
                        )}
                    </AnimatePresence>

                    {/* Ritual Area (Voting or Reveal) */}
                    <div className={cn("transition-all duration-1000 ease-in-out", encounter?.isRevealed ? "h-full" : "mt-8")}>
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
                                        // TODO: Pass down as action
                                        console.log("Sealing outcome:", val);
                                    }}
                                    hideVoteCounts={settings.hideVoteCounts}
                                />
                            </motion.div>
                        ) : (
                            <div className="space-y-16">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 justify-center max-w-5xl mx-auto">
                                    {deckValues.map((val: string, idx: number) => (
                                        <motion.div
                                            key={val}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.04 }}
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
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-center"
                                        >
                                            <div className="inline-flex flex-col items-center gap-4">
                                                <div className="flex gap-1.5">
                                                    {[0, 1, 2].map(i => (
                                                        <motion.div 
                                                            key={i}
                                                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                                                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                                                            className="w-1.5 h-1.5 rounded-full bg-pr-primary/50"
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] uppercase tracking-[0.4em] font-black text-pr-text-muted/40 italic">
                                                    Ritual in Progress
                                                </span>
                                            </div>
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
