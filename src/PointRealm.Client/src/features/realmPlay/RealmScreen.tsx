
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
import { Menu, Settings, X, LogOut, Link2, Check, Smile } from 'lucide-react';
import { Dialog } from '../../components/ui/Dialog';
import { EmojiPicker } from '../../components/ui/EmojiPicker';
import { AccountStatus } from '@/components/ui/AccountStatus';
import { QuestDialog } from './components/QuestDialog';
import { cn } from '@/lib/utils';
import { useTheme } from '@/theme/ThemeProvider';
import { ThemeModeToggle } from '@/components/ui/ThemeModeToggle';
import { useThemeMode } from '@/theme/ThemeModeProvider';

import styles from './realmScreen.module.css';


export function RealmScreen() {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    
    // We use the 'code' from params for hook
    const { state, loading, error, isConnected, connectionStatus, actions, connect } = useRealm(code);
    // undefined = no local override (use server), null = explicitly clear/abstain, string = value
    const [localVote, setLocalVote] = useState<string | null | undefined>(undefined);
    const [isQuestSidebarOpen, setQuestSidebarOpen] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [isQuestDialogOpen, setQuestDialogOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const prefersReducedMotion = useReducedMotion() ?? false;


    const { setThemeKey } = useTheme();
    const { mode } = useThemeMode();

    useEffect(() => {
        if (mode.useRealmTheme && state?.themeKey) {
            setThemeKey(state.themeKey);
        }
    }, [state?.themeKey, setThemeKey, mode.useRealmTheme]);

    useEffect(() => {
        if (error) {
            console.error("Realm Error:", error);
        }
    }, [error]);

    const encounter = state?.encounter ?? null;

    // Auth Check: myMemberId from session storage
    const myMemberId = code ? sessionStorage.getItem(`pointrealm:v1:realm:${code}:memberId`) : null;

    useEffect(() => {
        if (!encounter || encounter.isRevealed) {
            setLocalVote(undefined);
            return;
        }
        // If server says we haven't voted, sync local state to undefined (or null)
        if (myMemberId && encounter.hasVoted && encounter.hasVoted[myMemberId] === false) {
             // Only reset if we think we HAVE voted (localVote is not null/undefined)
             // casting to string check to differentiate from undefined
             if (typeof localVote === 'string') {
                 setLocalVote(undefined); 
             }
        }
    }, [encounter?.version, encounter?.isRevealed, encounter?.hasVoted, myMemberId]);


    // Handle initial loading or missing state
    if (loading || !state) {
        return (
            <PageShell
                backgroundDensity="low"
                backgroundVariant="realm"
                reducedMotion={prefersReducedMotion}
                contentClassName={styles.page}
                hideAccountStatus={true}
            >
                <div className="flex flex-col items-center justify-center h-full">
                     <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-pr-primary/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-pr-primary animate-spin" />
                    </div>
                        <div className="mt-4 text-pr-primary font-black uppercase tracking-[0.3em] text-sm animate-pulse">
                        {mode.phrases.enteringRealm}
                    </div>
                </div>
            </PageShell>
        );
    }

    const { settings, partyRoster, questLog } = state;
    
    const me = partyRoster.members.find(m => m.id === myMemberId);
    const isGM = me?.role === 'GM';
    const isObserver = me?.role === 'Observer' || me?.isObserver;
    const currentEmoji = me?.avatarEmoji ?? null;
    
    const activeQuest = encounter 
        ? questLog.quests.find(q => q.id === encounter.questId)
        : (questLog.quests.find(q => q.status === "Open") || questLog.quests[0]); 

    const handleVote = async (value: string) => {
        console.log("HandleVote called with:", value);
        if (!encounter || encounter.isRevealed) {
            console.log("Voting blocked: encounter missing or revealed");
            return;
        }

        
        // Calculate the effective current vote to check for toggle
        // We use myVote derived variable logic here:
        const currentVote = localVote !== undefined ? (localVote ?? null) : (serverVote ?? null);

        // If clicking the same card (vote is same as current), it's a toggle OFF
        if (currentVote === value) {
             setLocalVote(null); // Optimistic clear
             try {
                 await actions.selectRune(""); // Send empty/null to clear
             } catch {
                 setLocalVote(undefined); // Revert to server state on error
             }
             return;
        }
        
        // New vote
        setLocalVote(value); // Optimistic set
        try {
            await actions.selectRune(value);
        } catch {
            setLocalVote(undefined); // Revert to server state on error
        }
    };


    const handleCopyLink = async () => {
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAvatarEmojiSelect = async (emoji: string) => {
        try {
            await actions.setAvatarEmoji(emoji);
            setEmojiPickerOpen(false);
        } catch {
            // Errors are surfaced via realm store.
        }
    };


    const serverVote = encounter?.votes && myMemberId ? encounter.votes[myMemberId] : null;
    // Prioritize localVote if it is not undefined (meaning user interacted)
    const myVote = localVote !== undefined ? (localVote ?? null) : (serverVote ?? null);

    const getDeckValues = () => {
        if (settings.deckType === 'FIBONACCI') return ['1', '2', '3', '5', '8', '13', '21', '?', 'coffee'];
        if (settings.deckType === 'TSHIRT') return ['XS', 'S', 'M', 'L', 'XL', '?', 'coffee'];
        if (settings.deckType === 'CUSTOM' && settings.customDeckValues) return settings.customDeckValues;
        return ['1', '2', '3', '5', '8', '13', '?', 'coffee'];
    };

    const disabledReason = !me ? "member_not_found" 
        : isObserver ? "is_observer" 
        : !isConnected ? "not_connected" 
        : null;
    
    // Log disabled status periodically or on interaction? Better on render if logic changes
    // console.log("Can vote?", !disabledReason, disabledReason, { meId: myMemberId, isGM });

    return (

        <PageShell
            backgroundDensity="low"
            backgroundVariant="realm"
            reducedMotion={prefersReducedMotion}
            contentClassName={styles.page}
            hideAccountStatus={true}
            showThemeToggle={false}
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

                     <div className="pointer-events-auto flex items-center gap-3">
                        <ThemeModeToggle />
                        <AccountStatus />
                        <button
                            onClick={handleCopyLink}
                            className="px-4 py-3 bg-pr-surface/80 backdrop-blur border border-pr-border/50 rounded-xl hover:bg-pr-surface hover:border-pr-primary/50 transition-all text-pr-text-muted hover:text-pr-text shadow-lg relative group flex items-center gap-2"
                            title={mode.phrases.copyLink}
                        >
                            {copied ? (
                                <>
                                    <Check size={20} className="text-green-500" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-green-500">{mode.phrases.copied}</span>
                                </>
                            ) : (
                                <>
                                    <Link2 size={20} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{mode.phrases.copyLink}</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => setEmojiPickerOpen(true)}
                            className="p-3 bg-pr-surface/80 backdrop-blur border border-pr-border/50 rounded-xl hover:bg-pr-surface hover:border-pr-primary/50 transition-all text-pr-text-muted hover:text-pr-text shadow-lg"
                            title="Choose emoji avatar"
                        >
                            {currentEmoji ? (
                                <span className="text-lg" aria-label="Current avatar emoji">
                                    {currentEmoji}
                                </span>
                            ) : (
                                <Smile size={24} />
                            )}
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
                        onStartNextQuest={() => actions.startNextQuest()}
                        onSealOutcome={async (val) => {
                            const numeric = Number(val);
                            if (Number.isFinite(numeric)) {
                                await actions.sealOutcome(numeric);
                            }
                        }}
                        deckValues={getDeckValues()}
                        hideVoteCounts={settings.hideVoteCounts}
                        actionsDisabled={!isConnected}
                        className={cn(
                            "transition-all duration-500",
                            encounter && !encounter.isRevealed && !isGM ? "pb-56 sm:pb-72" : "pb-12 sm:pb-20"
                        )}
                     />
                </main>

                {/* Hand / Voting Controls - GM doesn't vote traditionally in this layout to save space */}
                {encounter && !encounter.isRevealed && !isObserver && (
                    <RuneHand 
                        options={getDeckValues()}
                        selectedValue={myVote || null}
                        disabled={!!disabledReason} // GM allowed to vote, Observers not.
                        onVote={(val) => {
                            if (disabledReason) {
                                console.warn("Vote blocked by disabled state:", disabledReason);
                                return;
                            }
                            console.log("RuneHand onVote triggered:", val);
                            handleVote(val);
                        }}

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
                                        onAddQuest={() => setQuestDialogOpen(true)}
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
            <Dialog
                isOpen={isEmojiPickerOpen}
                onClose={() => setEmojiPickerOpen(false)}
                title="Choose Your Sigil"
                subtitle="Pick an emoji avatar"
            >
                <EmojiPicker
                    selectedEmoji={currentEmoji}
                    onSelect={handleAvatarEmojiSelect}
                    disabled={!isConnected}
                />
            </Dialog>

            <QuestDialog
                isOpen={isQuestDialogOpen}
                mode="add"
                onClose={() => setQuestDialogOpen(false)}
                onSubmit={actions.addQuest}
            />
        </PageShell>
    );
}
