
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRealm } from '../../hooks/useRealm';
import { QuestLogPanel } from './components/QuestLogPanel';
import { ConnectionStatusBanner } from '@/realtime/ConnectionStatusBanner';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PageShell } from '../../components/shell/PageShell';
import { RealmSettingsDialog } from '../realmLobby/components/RealmSettingsDialog';
import { RealmTable } from './components/RealmTable';
import { RuneHand } from './components/RuneHand';
import { Menu, Settings, X, LogOut, Link2, Check } from 'lucide-react';

import styles from './realmScreen.module.css';


export function RealmScreen() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    
    // We use the 'code' from params for hook
    const { state, loading, error, isConnected, connectionStatus, actions, connect } = useRealm(code);
    const [isQuestSidebarOpen, setQuestSidebarOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
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
                <div className="flex flex-col items-center justify-center h-full">
                     <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-pr-primary/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-pr-primary animate-spin" />
                    </div>
                    <div className="mt-4 text-pr-primary font-black uppercase tracking-[0.3em] text-sm animate-pulse">
                        Entering the Realm
                    </div>
                </div>
            </PageShell>
        );
    }

    const { settings, partyRoster, questLog, encounter } = state;
    
    // Auth Check: myMemberId from session storage
    const myMemberId = code ? sessionStorage.getItem(`pointrealm:v1:realm:${code}:memberId`) : null; 
    const me = partyRoster.members.find(m => m.id === myMemberId);
    const isGM = me?.role === 'GM';
    
    const activeQuest = encounter 
        ? questLog.quests.find(q => q.id === encounter.questId)
        : (questLog.quests.find(q => q.status === "Open") || questLog.quests[0]); 

    const handleVote = async (value: string) => {
        if (!encounter || encounter.isRevealed) return;
        
        // If clicking the already selected vote, unselect it (send empty string)
        if (myVote === value) {
            await actions.selectRune("");
            return;
        }
        
        await actions.selectRune(value);
    };

    const handleCopyLink = async () => {
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };


    const myVote = encounter?.votes && myMemberId ? encounter.votes[myMemberId] : null;

    const getDeckValues = () => {
        if (settings.deckType === 'FIBONACCI') return ['1', '2', '3', '5', '8', '13', '21', '?', 'coffee'];
        if (settings.deckType === 'TSHIRT') return ['XS', 'S', 'M', 'L', 'XL', '?', 'coffee'];
        if (settings.deckType === 'CUSTOM' && settings.customDeckValues) return settings.customDeckValues;
        return ['1', '2', '3', '5', '8', '13', '?', 'coffee'];
    };

    return (
        <PageShell
            backgroundDensity="low"
            backgroundVariant="realm"
            reducedMotion={prefersReducedMotion}
            contentClassName={styles.page}
        >
            <AnimatePresence>
                {connectionStatus !== 'connected' && (
                    <ConnectionStatusBanner
                        status={connectionStatus}
                        onRetry={() => connect(code || '')}
                    />
                )}
            </AnimatePresence>
            
            <div className={styles.shell}>
                {/* Header Controls */}
                <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-40 flex justify-between items-start pointer-events-none">
                     <div className="pointer-events-auto">
                        <button 
                            onClick={() => setQuestSidebarOpen(!isQuestSidebarOpen)}
                            className="p-3 bg-pr-surface/80 backdrop-blur border border-pr-border/50 rounded-xl hover:bg-pr-surface hover:border-pr-primary/50 transition-all text-pr-text-muted hover:text-pr-text shadow-lg"
                        >
                             <Menu size={24} />
                        </button>
                     </div>

                     <div className="pointer-events-auto flex items-center gap-2">
                        <button
                            onClick={handleCopyLink}
                            className="p-3 bg-pr-surface/80 backdrop-blur border border-pr-border/50 rounded-xl hover:bg-pr-surface hover:border-pr-primary/50 transition-all text-pr-text-muted hover:text-pr-text shadow-lg relative group"
                            title="Copy Realm Link"
                        >
                            {copied ? <Check size={24} className="text-green-500" /> : <Link2 size={24} />}
                        </button>

                        {isGM && (
                            <button
                                onClick={() => setSettingsOpen(true)}
                                className="p-3 bg-pr-surface/80 backdrop-blur border border-pr-border/50 rounded-xl hover:bg-pr-surface hover:border-pr-primary/50 transition-all text-pr-text-muted hover:text-pr-text shadow-lg"
                            >
                                <Settings size={24} />
                            </button>
                        )}
                         <button
                           onClick={() => navigate('/')}
                           className="p-3 bg-pr-surface/80 backdrop-blur border border-pr-border/50 rounded-xl hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all text-pr-text-muted shadow-lg"
                        >
                             <LogOut size={24} />
                        </button>
                     </div>
                </header>

                {/* Main Table Area */}
                <main className={styles.mainContainer}>
                     <RealmTable
                        quest={activeQuest || null}
                        encounter={encounter}
                        members={partyRoster.members}
                        isGM={!!isGM}
                        onReveal={() => actions.revealProphecy()}
                        onReroll={() => actions.reRollFates()}
                        onSealOutcome={async (val) => {
                            const numeric = Number(val);
                            if (Number.isFinite(numeric)) {
                                await actions.sealOutcome(numeric);
                            }
                        }}
                        deckValues={getDeckValues()}
                        hideVoteCounts={settings.hideVoteCounts}
                        actionsDisabled={!isConnected}
                        className="pb-32 sm:pb-40" // Add padding to avoid overlap with bottom hand
                     />
                </main>

                {/* Hand / Voting Controls */}
                {encounter && !encounter.isRevealed && (
                    <RuneHand 
                        options={getDeckValues()}
                        selectedValue={myVote || null}
                        disabled={!me || me.role === 'GM' || !isConnected} // GM can vote? Usually no.
                        onVote={handleVote}
                    />
                )}

                {/* Quest Sidebar Drawer */}
                <AnimatePresence>
                    {isQuestSidebarOpen && (
                         <>
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setQuestSidebarOpen(false)}
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
                            />
                            <motion.aside
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={styles.sidebar}
                            >
                                <div className="p-4 border-b border-pr-border flex justify-between items-center bg-pr-surface">
                                    <h2 className="text-lg font-serif font-bold text-pr-text">Quest Log</h2>
                                    <button onClick={() => setQuestSidebarOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                     <QuestLogPanel
                                        quests={questLog.quests}
                                        activeQuestId={encounter?.questId || undefined}
                                        isGM={!!isGM}
                                        onAddQuest={() => {}} // Add quest logic if needed
                                        onOpenSettings={() => setSettingsOpen(true)}
                                        onSelectQuest={(id) => {
                                             if(isGM) actions.startEncounter(id);
                                             // On mobile maybe close sidebar?
                                        }}
                                        minimal
                                    />
                                </div>
                            </motion.aside>
                         </>
                    )}
                </AnimatePresence>

            </div>

            {/* Modals */}
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
