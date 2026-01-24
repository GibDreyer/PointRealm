import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRealm } from '../../hooks/useRealm';
import { QuestLogPanel } from './components/QuestLogPanel';
import { PartyRosterPanel } from './components/PartyRosterPanel';
import { EncounterPanel } from './components/EncounterPanel';
import { RealmBackground } from '../../components/ui/RealmBackground';
import { QuestDialog } from './components/QuestDialog';

export function RealmScreen() {
    const { code, realmCode: paramRealmCode } = useParams<{ code?: string; realmCode?: string }>();
    // Support both /realm/:code and /realms/:realmCode
    const targetCode = code || paramRealmCode;
    
    const { state, loading, error, isConnected, actions } = useRealm(targetCode);
    const [isQuestModalOpen, setQuestModalOpen] = useState(false);

    useEffect(() => {
        if (error) {
            console.error("Realm Error:", error);
        }
    }, [error]);

    if (loading || !state) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RealmBackground />
                <div className="text-[var(--pr-primary)] animate-pulse font-bold text-xl">
                    Entering the Realm...
                </div>
            </div>
        );
    }

    const { settings, partyRoster, questLog, encounter } = state;
    
    // Derived state
    const myMemberId = targetCode ? sessionStorage.getItem(`pointrealm:v1:realm:${targetCode}:memberId`) : null; 
    const isGM = partyRoster.members.find(m => m.id === myMemberId)?.role === 'GM';
    const me = partyRoster.members.find(m => m.id === myMemberId);
    
    const activeQuest = questLog.quests.find(q => q.id === encounter?.questId) || 
                       questLog.quests.find(q => q.id === state.questLog.quests.find(x => x.status === "Open")?.id); 

    const handleVote = async (value: string) => {
        if (!encounter || encounter.isRevealed) return;
        await actions.selectRune(value);
    };

    const myVote = encounter?.votes && myMemberId ? encounter.votes[myMemberId] : null;

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--pr-bg)] text-[var(--pr-text)] font-sans">
            <RealmBackground />
            
            {/* Mobile/Tablet Header would go here (hamburger menu for panels) */}
            
            <div className="flex-1 flex overflow-hidden z-10 relative">
                {/* Left Panel: Quest Log */}
                <aside className="hidden md:flex w-[280px] lg:w-[320px] flex-col h-full border-r border-[var(--pr-border)]">
                    <QuestLogPanel 
                        quests={questLog.quests}
                        activeQuestId={encounter?.questId || undefined}
                        isGM={!!isGM}
                        onAddQuest={() => setQuestModalOpen(true)} 
                        onSelectQuest={(id) => {
                             if(isGM) actions.startEncounter(id);
                        }}
                    />
                </aside>

                {/* Center Panel: Encounter */}
                <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {!isConnected && (
                         <div className="bg-[var(--pr-destructive)] text-white px-4 py-2 text-center text-sm font-bold">
                            Connection Lost. Reconnecting...
                         </div>
                    )}
                    <EncounterPanel 
                        quest={activeQuest || null} 
                        encounter={encounter}
                        settings={settings}
                        isGM={!!isGM}
                        canVote={!!me && me.role !== "GM"} 
                        myVote={myVote || null}
                        onVote={handleVote}
                        onStartEncounter={(id) => actions.startEncounter(id)}
                    />
                </main>

                {/* Right Panel: Party Roster */}
                <aside className="hidden lg:flex w-[260px] xl:w-[300px] flex-col h-full border-l border-[var(--pr-border)]">
                    <PartyRosterPanel 
                        members={partyRoster.members}
                        isGM={!!isGM}
                        currentMemberId={myMemberId || ""}
                        hideVoteCounts={settings.hideVoteCounts}
                        encounterStatus={encounter?.isRevealed ? 'revealed' : (encounter ? 'voting' : 'idle')}
                    />
                </aside>
            </div>

            {/* Modals */}
            <QuestDialog 
                isOpen={isQuestModalOpen}
                onClose={() => setQuestModalOpen(false)}
                onSubmit={async (t, d) => {
                    await actions.addQuest(t, d);
                }}
                mode="add"
            />
        </div>
    );
}
