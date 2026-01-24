import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRealm } from '../../hooks/useRealm';
import { QuestLogPanel } from './components/QuestLogPanel';
import { PartyRosterPanel } from './components/PartyRosterPanel';
import { EncounterPanel } from './components/EncounterPanel';
import { RealmShell } from '../../app/layouts/RealmShell';
import { QuestDialog } from './components/QuestDialog';
import { ConnectionBanner } from '../realmLobby/components/ConnectionBanner';
import { motion } from 'framer-motion';

export function RealmScreen() {
    const { code } = useParams<{ code: string }>();
    
    // We use the 'code' from params for hook
    const { state, loading, error, isConnected, actions, connect } = useRealm(code);
    const [isQuestModalOpen, setQuestModalOpen] = useState(false);

    useEffect(() => {
        if (error) {
            console.error("Realm Error:", error);
        }
    }, [error]);

    // Handle initial loading or missing state
    if (loading || !state) {
        return (
            <RealmShell className="items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-6"
                >
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-pr-primary/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-pr-primary animate-spin" />
                    </div>
                    <div className="text-pr-primary font-black uppercase tracking-[0.3em] text-sm animate-pulse">
                        Entering the Realm
                    </div>
                </motion.div>
            </RealmShell>
        );
    }

    const { settings, partyRoster, questLog, encounter } = state;
    
    // Auth Check: myMemberId from session storage
    const myMemberId = code ? sessionStorage.getItem(`pointrealm:v1:realm:${code}:memberId`) : null; 
    const me = partyRoster.members.find(m => m.id === myMemberId);
    const isGM = me?.role === 'GM';
    
    const activeQuest = questLog.quests.find(q => q.id === encounter?.questId) || 
                       questLog.quests.find(q => q.status === "Open"); 

    const handleVote = async (value: string) => {
        if (!encounter || encounter.isRevealed) return;
        await actions.selectRune(value);
    };

    const myVote = encounter?.votes && myMemberId ? encounter.votes[myMemberId] : null;

    return (
        <RealmShell className="overflow-hidden p-0 max-w-none">
            {/* Focal Glow (Centered on Encounter) */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-pr-primary/[0.04] rounded-full blur-[140px] pointer-events-none z-0" />

            {/* Reconnection Banner */}
             {!isConnected && (
                  <ConnectionBanner isConnecting={loading} onRetry={() => connect(code || "")} />
             )}
            
            <div className="flex-1 flex overflow-hidden relative w-full h-full z-10">
                
                {/* Left Panel: Quest Log (25% on LG+) */}
                <motion.aside 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="hidden md:flex w-[280px] lg:w-[25%] shrink-0 flex-col h-full border-r border-pr-border/20 bg-pr-surface/20 backdrop-blur-sm"
                >
                    <QuestLogPanel 
                        quests={questLog.quests}
                        activeQuestId={encounter?.questId || undefined}
                        isGM={!!isGM}
                        onAddQuest={() => setQuestModalOpen(true)} 
                        onSelectQuest={(id) => {
                             if(isGM) actions.startEncounter(id);
                        }}
                    />
                </motion.aside>

                {/* Center Panel: Encounter (50% on LG+) */}
                <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative">
                    <EncounterPanel 
                        quest={activeQuest || null} 
                        encounter={encounter}
                        settings={settings}
                        partyRoster={partyRoster}
                        isGM={!!isGM}
                        canVote={!!me && me.role !== "GM" && !encounter?.isRevealed} 
                        myVote={myVote || null}
                        onVote={handleVote}
                        onStartEncounter={(id) => actions.startEncounter(id)}
                    />
                </main>

                {/* Right Panel: Party Roster (25% on LG+) */}
                <motion.aside 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="hidden lg:flex w-[25%] shrink-0 flex-col h-full border-l border-pr-border/20 bg-pr-surface/20 backdrop-blur-sm"
                >
                    <PartyRosterPanel 
                        members={partyRoster.members}
                        currentMemberId={myMemberId || ""}
                        hideVoteCounts={settings.hideVoteCounts}
                        encounterStatus={encounter?.isRevealed ? 'revealed' : (encounter ? 'voting' : 'idle')}
                    />
                </motion.aside>
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
        </RealmShell>
    );
}
