import { Encounter, Quest } from '../../../types/realm';
import { ExternalLink } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface EncounterPanelProps {
    quest: Quest | null;
    encounter: Encounter | null;
    isGM: boolean;
    canVote: boolean;
    myVote?: string | null;
    onVote: (value: string) => void;
    onStartEncounter: (questId: string) => void;
}

export function EncounterPanel({ quest, encounter, isGM, canVote, myVote, onVote }: EncounterPanelProps) {
    if (!quest) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--pr-bg)]/80">
                <div className="max-w-md p-8 rounded-2xl border-2 border-dashed border-[var(--pr-border)]">
                    <h2 className="text-xl font-bold text-[var(--pr-text-muted)] mb-2">No Active Quest</h2>
                    <p className="text-[var(--pr-text-dim)]">The Realm is currently quiet. {isGM ? "Select a quest from the log to begin an encounter." : "Wait for the Game Master to begin."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[var(--pr-bg)] relative overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8">
                    {/* Header */}
                    <header className="space-y-4 text-center">
                        <div className="inline-block px-3 py-1 rounded-full bg-[var(--pr-primary)]/10 text-[var(--pr-primary)] text-xs font-bold uppercase tracking-widest">
                            Current Quest
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[var(--pr-text)] to-[var(--pr-text-muted)]" style={{ fontFamily: 'var(--pr-heading-font)' }}>
                            {quest.title}
                        </h1>
                        {quest.externalUrl && (
                            <a href={quest.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[var(--pr-primary)] hover:text-[var(--pr-primary-hover)] transition-colors">
                                <ExternalLink className="w-4 h-4" />
                                <span>View External Details</span>
                            </a>
                        )}
                        {quest.description && (
                            <p className="text-lg text-[var(--pr-text-dim)] max-w-2xl mx-auto leading-relaxed">
                                {quest.description}
                            </p>
                        )}
                    </header>

                    {/* Voting Area */}
                    <div className="mt-12">
                        {encounter?.isRevealed ? (
                            <div className="p-8 rounded-xl bg-[var(--pr-surface)] border border-[var(--pr-border)] text-center">
                                <h3 className="text-2xl font-bold mb-4">Prophecy Revealed</h3>
                                <div className="text-[var(--pr-text-dim)]">Results visualization placeholder</div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-center">
                                {['1', '2', '3', '5', '8', '13', '?', 'coffee'].map(val => (
                                    <button
                                        key={val}
                                        disabled={!canVote}
                                        onClick={() => onVote(val)}
                                        className={cn(
                                            "aspect-[2/3] rounded-lg border-2 flex items-center justify-center text-xl font-bold transition-all transform hover:-translate-y-1 hover:shadow-lg",
                                            myVote === val 
                                                ? "bg-[var(--pr-primary)] border-[var(--pr-primary)] text-black shadow-[0_0_20px_var(--pr-primary-glow)]" 
                                                : "bg-[var(--pr-surface)] border-[var(--pr-border)] hover:border-[var(--pr-primary-dim)]"
                                        )}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {!canVote && !isGM && (
                            <div className="mt-4 text-center text-[var(--pr-text-muted)] text-sm">
                                You are observing this encounter.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
