import React, { useState } from 'react';
import { RealmShell } from '../../app/layouts/RealmShell';
import { RuneCard } from '../realmPlay/components/RuneCard';
import { QuestLogPanel } from '../realmPlay/components/QuestLogPanel';
import { PartyRosterPanel } from '../realmPlay/components/PartyRosterPanel';
import { useToast } from '../../components/ui/ToastSystem';
import { ProphecyReveal } from '../reveal/ProphecyReveal';

export const DevComponentsPage: React.FC = () => {
  const [selectedRune, setSelectedRune] = useState<string | null>(null);
  const [hideVotes, setHideVotes] = useState(false);
  const { toast } = useToast();

  const [quests] = useState<any[]>([
    { id: '1', title: 'Determine Project Scope', status: 'active' },
    { id: '2', title: 'Select Tech Stack', status: 'completed', estimate: '5' },
    { id: '3', title: 'Design Database Schema', status: 'pending' },
    { id: '4', title: 'Implement Authentication', status: 'pending' },
  ]);

  const [members] = useState<any[]>([
    { id: '1', name: 'Gandalf (GM)', role: 'GM', isOnline: true, status: 'ready' },
    { id: '2', name: 'Aragorn', role: 'Traveler', isOnline: true, status: 'choosing' },
    { id: '3', name: 'Legolas', role: 'Traveler', isOnline: true, status: 'resting' },
    { id: '4', name: 'Gimli', role: 'Traveler', isOnline: false, status: 'resting' },
  ]);

  return (
    <RealmShell>
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-10">
        <header className="py-6 border-b border-pr-border/20">
            <h1 className="text-2xl font-black text-pr-primary uppercase tracking-widest">Arcane Repository</h1>
            <p className="text-pr-text-muted text-sm italic">Component Interaction Laboratory</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Column 1: Quests & Controls */}
            <div className="lg:col-span-3 flex flex-col gap-6">
                <QuestLogPanel 
                    quests={quests}
                    activeQuestId="1"
                    isGM={true}
                    onSelectQuest={(id) => toast(`Selected Quest: ${id}`, 'info')}
                    onAddQuest={() => toast('Add Quest Clicked', 'info')}
                />

                <div className="p-4 rounded-[var(--pr-radius-md)] border border-pr-border/50 bg-pr-surface/30">
                    <h3 className="text-sm font-bold mb-2">Notice Controls</h3>
                    <p className="text-xs text-pr-text-muted mb-4 italic">Simulate GM and state actions</p>
                    <div className="flex flex-wrap gap-2">
                        <button className="px-3 py-1 bg-pr-primary/20 text-pr-primary rounded-full text-xs font-bold" onClick={() => toast('Encounter Started', 'success')}>Start</button>
                        <button className="px-3 py-1 bg-pr-secondary/20 text-pr-secondary rounded-full text-xs font-bold" onClick={() => toast('Prophecy Revealed', 'info')}>Reveal</button>
                    </div>
                </div>
            </div>

            {/* Column 2: Voting & Reveal Area */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center min-h-[400px]">
                {selectedRune === 'REVEAL_DEMO' ? (
                    <div className="w-full h-[600px] border border-pr-border/20 rounded-xl overflow-hidden bg-pr-bg/40 backdrop-blur-sm p-6">
                        <ProphecyReveal 
                            encounter={{
                                id: 'dev-enc',
                                questId: '1',
                                status: 'Active',
                                isRevealed: true,
                                votes: {
                                    '1': '5',
                                    '2': '8',
                                    '3': '5',
                                    '4': '3'
                                }
                            } as any}
                            partyRoster={members}
                            isGM={true}
                            deckValues={['1','2','3','5','8','13','?']}
                            onSealOutcome={async (val) => toast(`Sealed: ${val}`, 'success')}
                            hideVoteCounts={hideVotes}
                        />
                    </div>
                ) : (
                    <div className="space-y-12 w-full text-center">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                            {['1', '2', '3', '5', '8', '13', '?', 'coffee'].map((val) => (
                                <RuneCard
                                    key={val}
                                    value={val}
                                    isSelected={selectedRune === val}
                                    onClick={() => setSelectedRune(val === selectedRune ? null : val)}
                                    className="w-full"
                                />
                            ))}
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex gap-4">
                                <RuneCard value="Disabled" disabled className="w-full" />
                                <button 
                                    className="px-6 py-3 bg-pr-secondary text-pr-bg font-black uppercase tracking-widest rounded-lg shadow-lg hover:shadow-pr-secondary/20 transition-all active:scale-95"
                                    onClick={() => setSelectedRune('REVEAL_DEMO')}
                                >
                                    Test Reveal Ritual
                                </button>
                            </div>
                            <p className="text-[10px] text-pr-text-muted uppercase tracking-widest font-bold">Inscribe your intent</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Column 3: Party Roster */}
            <div className="lg:col-span-3 flex flex-col gap-6">
                <PartyRosterPanel
                    members={members}
                    currentMemberId="1"
                    hideVoteCounts={hideVotes}
                    encounterStatus={selectedRune === 'REVEAL_DEMO' ? 'revealed' : 'voting'}
                />
                
                <div className="p-4 rounded-[var(--pr-radius-md)] border border-pr-border/50 bg-pr-surface/30">
                    <label className="flex items-center gap-3 text-xs cursor-pointer select-none font-bold uppercase tracking-widest text-pr-text-muted">
                        <input 
                            type="checkbox" 
                            checked={hideVotes} 
                            onChange={(e) => setHideVotes(e.target.checked)} 
                            className="w-4 h-4 rounded border-pr-border bg-pr-bg text-pr-primary focus:ring-pr-primary"
                        />
                        Shroud the Consensus
                    </label>
                </div>
            </div>
        </div>
      </div>
    </RealmShell>
  );
};
