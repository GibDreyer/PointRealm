import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRealm } from '../../hooks/useRealm';
import { QuestLogPanel } from './components/QuestLogPanel';
import { PartyRosterPanel } from './components/PartyRosterPanel';
import { EncounterPanel } from './components/EncounterPanel';
import { QuestDialog } from './components/QuestDialog';
import { ConnectionBanner } from '../realmLobby/components/ConnectionBanner';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PageShell } from '../../components/shell/PageShell';
import { Users } from 'lucide-react';
import { RealmSettingsDialog } from '../realmLobby/components/RealmSettingsDialog';
import styles from './realmScreen.module.css';

export function RealmScreen() {
    const { code } = useParams<{ code: string }>();
    
    // We use the 'code' from params for hook
    const { state, loading, error, isConnected, actions, connect } = useRealm(code);
    const [isQuestModalOpen, setQuestModalOpen] = useState(false);
    const [isQuestOpen, setQuestOpen] = useState(false);
    const [isPartyOpen, setPartyOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const prefersReducedMotion = useReducedMotion() ?? false;

    useEffect(() => {
        if (error) {
            console.error("Realm Error:", error);
        }
    }, [error]);

    // Handle initial loading or missing state
    if (loading || !state) {
        return (
            <PageShell
                backgroundDensity="low"
                backgroundVariant="realm"
                reducedMotion={prefersReducedMotion}
                contentClassName={styles.page}
            >
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
            </PageShell>
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
    const readyCount = partyRoster.members.filter(m => m.status === 'ready').length;

    return (
        <PageShell
            backgroundDensity="low"
            backgroundVariant="realm"
            reducedMotion={prefersReducedMotion}
            contentClassName={styles.page}
        >

            {/* Reconnection Banner */}
             {!isConnected && (
                  <ConnectionBanner isConnecting={loading} onRetry={() => connect(code || "")} />
             )}
            
            <div className={styles.shell}>
                <div className={styles.mobileControls}>
                    <button type="button" className={styles.mobileButton} onClick={() => setQuestOpen(true)}>
                        Quest Log
                    </button>
                    <button type="button" className={styles.mobileButton} onClick={() => setPartyOpen(true)}>
                        Party
                    </button>
                </div>

                <div className={styles.layout}>
                    {/* Left Panel: Quest Log */}
                    <motion.aside
                        initial={{ x: -16, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={`${styles.questPanel} ${styles.panelSurface}`}
                    >
                        <QuestLogPanel
                            quests={questLog.quests}
                            activeQuestId={encounter?.questId || undefined}
                            isGM={!!isGM}
                            onAddQuest={() => setQuestModalOpen(true)}
                            onOpenSettings={() => setSettingsOpen(true)}
                            onSelectQuest={(id) => {
                                 if(isGM) actions.startEncounter(id);
                            }}
                        />
                    </motion.aside>

                    {/* Center Panel: Encounter */}
                    <main className={styles.center}>
                        <EncounterPanel 
                            quest={activeQuest || null} 
                            encounter={encounter}
                            settings={settings}
                            partyRoster={partyRoster}
                            isGM={!!isGM}
                            canVote={!!me && me.role !== "GM" && !encounter?.isRevealed} 
                            myVote={myVote || null}
                            onVote={handleVote}
                            onReroll={() => actions.reRollFates()}
                            onReveal={() => actions.revealProphecy()}
                            onSealOutcome={async (val) => {
                                const numeric = Number(val);
                                if (Number.isFinite(numeric)) {
                                    await actions.sealOutcome(numeric);
                                }
                            }}
                        />
                    </main>

                    {/* Right Panel: Party Dock + Panel */}
                    <div className={styles.rightColumn}>
                        <div className={styles.partyDock}>
                            <button
                                type="button"
                                className={styles.partyDockButton}
                                onClick={() => setPartyOpen((prev) => !prev)}
                                aria-label="Open party panel"
                            >
                                <Users size={18} />
                            </button>
                            <div className={styles.partyDockStat}>
                                {settings.hideVoteCounts ? '??' : `${readyCount}/${partyRoster.members.length}`}
                            </div>
                            <div className={styles.partyDockStat}>
                                {encounter ? (encounter.isRevealed ? 'Seal' : 'Vote') : 'Idle'}
                            </div>
                        </div>

                        <AnimatePresence>
                            {isPartyOpen && (
                                <motion.aside
                                    initial={{ x: 24, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: 24, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    className={`${styles.partyPanel} ${styles.panelSurface}`}
                                >
                                    <PartyRosterPanel 
                                        members={partyRoster.members}
                                        currentMemberId={myMemberId || ""}
                                        hideVoteCounts={settings.hideVoteCounts}
                                        encounterStatus={encounter?.isRevealed ? 'revealed' : (encounter ? 'voting' : 'idle')}
                                    />
                                </motion.aside>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isQuestOpen && (
                    <motion.div
                        className={styles.drawerOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={() => setQuestOpen(false)}
                    >
                        <motion.div
                            className={styles.drawer}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 30, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <QuestLogPanel
                                quests={questLog.quests}
                                activeQuestId={encounter?.questId || undefined}
                                isGM={!!isGM}
                                onAddQuest={() => setQuestModalOpen(true)}
                                onOpenSettings={() => setSettingsOpen(true)}
                                onSelectQuest={(id) => {
                                     if(isGM) actions.startEncounter(id);
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isPartyOpen && (
                    <motion.div
                        className={styles.drawerOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        onClick={() => setPartyOpen(false)}
                    >
                        <motion.div
                            className={styles.drawer}
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 30, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <PartyRosterPanel 
                                members={partyRoster.members}
                                currentMemberId={myMemberId || ""}
                                hideVoteCounts={settings.hideVoteCounts}
                                encounterStatus={encounter?.isRevealed ? 'revealed' : (encounter ? 'voting' : 'idle')}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <QuestDialog 
                isOpen={isQuestModalOpen}
                onClose={() => setQuestModalOpen(false)}
                onSubmit={async (t, d) => {
                    await actions.addQuest(t, d);
                }}
                mode="add"
            />

            {isSettingsOpen && isGM && code && (
                <RealmSettingsDialog 
                    realmCode={code}
                    currentSettings={settings}
                    currentThemeKey={state.themeKey || 'dark-fantasy-arcane'}
                    isOpen={isSettingsOpen}
                    onClose={() => setSettingsOpen(false)}
                />
            )}
        </PageShell>
    );
}
