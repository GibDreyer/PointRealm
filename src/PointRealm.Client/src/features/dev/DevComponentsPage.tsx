import React, { useState } from 'react';
import { RealmShell } from '../realmPlay/components/RealmShell';
import { RuneCard } from '../../components/RuneCard';
import { QuestLog } from '../realmPlay/components/QuestLog';
import { PartyRoster } from '../realmPlay/components/PartyRoster';
import { GMControls } from '../realmPlay/components/GMControls';
import { useToast } from '../ui/ToastContext';
import { ProphecyReveal } from '../reveal/ProphecyReveal';

export const DevComponentsPage: React.FC = () => {
  // State for components
  const [selectedRune, setSelectedRune] = useState<string | null>(null);
  const [hideVotes, setHideVotes] = useState(false);
  const { addToast } = useToast();

  // Mock Data
  const [quests, setQuests] = useState<any[]>([
    { id: '1', title: 'Determine Project Scope', status: 'active' },
    { id: '2', title: 'Select Tech Stack', status: 'completed', estimate: '5' },
    { id: '3', title: 'Design Database Schema', status: 'pending' },
    { id: '4', title: 'Implement Authentication', status: 'pending' },
  ]);

  const [members/*, setMembers*/] = useState<any[]>([
    { id: '1', name: 'Gandalf (GM)', role: 'gm', presence: 'online', hasVoted: true },
    { id: '2', name: 'Aragorn', role: 'player', presence: 'online', hasVoted: true },
    { id: '3', name: 'Legolas', role: 'player', presence: 'online', hasVoted: false },
    { id: '4', name: 'Gimli', role: 'player', presence: 'away', hasVoted: true },
    { id: '5', name: 'Boromir', role: 'player', presence: 'disconnected', hasVoted: false },
  ]);

  return (
    <RealmShell title="Dev Components" subtitle="Component Interaction Laboratory">
      {/* Column 1: Quests & Controls */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        <QuestLog 
          quests={quests}
          activeQuestId="1"
          canManage={true}
          onSelectQuest={(id) => addToast(`Selected Quest: ${id}`, 'info')}
          onAddQuest={() => addToast('Add Quest Clicked', 'info')}
          onEditQuest={(id) => addToast(`Edit Quest: ${id}`, 'info')}
          onDeleteQuest={(id) => addToast(`Delete Quest: ${id}`, 'warning')}
          onReorder={(ids) => {
             addToast('Quests Reordered', 'success');
             // Naive reorder locally
             const reordered = ids.map(id => quests.find(q => q.id === id));
             setQuests(reordered);
          }}
        />

        <GMControls 
          phase="revealed"
          canGM={true}
          onStartEncounter={async () => { await new Promise(r => setTimeout(r, 1000)); addToast('Encounter Started', 'success'); }}
          onReveal={async () => { await new Promise(r => setTimeout(r, 1000)); addToast('Prophecy Revealed', 'rune'); }}
          onReroll={async () => { await new Promise(r => setTimeout(r, 1000)); addToast('Fates Re-rolled', 'warning'); }}
          onSealOutcome={async (val) => addToast(`Outcome Sealed: ${val}`, 'rune')}
        />
        
        <div className="p-4 rounded border border-border/50 bg-surface/30">
           <h3 className="text-sm font-bold mb-2">Toast Triggers</h3>
           <div className="flex flex-wrap gap-2">
             <button className="px-2 py-1 bg-info/20 text-info rounded text-xs" onClick={() => addToast('Info Toast', 'info')}>Info</button>
             <button className="px-2 py-1 bg-success/20 text-success rounded text-xs" onClick={() => addToast('Success Toast', 'success')}>Success</button>
             <button className="px-2 py-1 bg-warning/20 text-warning rounded text-xs" onClick={() => addToast('Warning Toast', 'warning')}>Warning</button>
             <button className="px-2 py-1 bg-danger/20 text-danger rounded text-xs" onClick={() => addToast('Error Toast', 'error')}>Error</button>
             <button className="px-2 py-1 bg-secondary/20 text-secondary rounded text-xs" onClick={() => addToast('Rune Toast', 'rune')}>Rune</button>
           </div>
        </div>
      </div>

      {/* Column 2: Voting & Reveal Area */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center min-h-[400px]">
        {selectedRune === 'REVEAL_DEMO' ? (
             <div className="w-full h-[600px] border border-border/50 rounded-xl overflow-hidden bg-bg">
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
                            '4': '3',
                            '5': null 
                        },
                        distribution: [], // letting component calc for now or mock if needed
                        suggestedOath: { kind: 'median', value: '5' }
                    } as any}
                    partyRoster={members}
                    isGM={true}
                    deckValues={['1','2','3','5','8','13','?']}
                    onSealOutcome={async (val) => addToast(`Sealed: ${val}`, 'success')}
                    hideVoteCounts={hideVotes}
                 />
             </div>
        ) : (
            <>
                <div className="flex flex-wrap justify-center gap-4">
                  {['1', '2', '3', '5', '8', '13', '?', '☕'].map((val) => (
                    <RuneCard
                      key={val}
                      value={val}
                      selected={selectedRune === val}
                      onSelect={(v) => setSelectedRune(v === selectedRune ? null : v)}
                    />
                  ))}
                </div>
                
                <div className="mt-8 flex gap-4">
                   <RuneCard value="Disabled" disabled onSelect={() => {}} />
                   <button 
                       className="px-4 py-2 bg-secondary text-black font-bold rounded"
                       onClick={() => setSelectedRune('REVEAL_DEMO')}
                   >
                       Test Reveal Animation
                   </button>
                </div>
            </>
        )}
      </div>

      {/* Column 3: Party Roster */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        <PartyRoster
          members={members}
          totalVoters={5}
          votedCount={3}
          hideVoteCounts={hideVotes}
        />
        
        <div className="p-4 rounded border border-border/50 bg-surface/30">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={hideVotes} 
              onChange={(e) => setHideVotes(e.target.checked)} 
              className="rounded border-border bg-surface"
            />
            Hide Vote Counts
          </label>
        </div>
      </div>
    </RealmShell>
  );
};
