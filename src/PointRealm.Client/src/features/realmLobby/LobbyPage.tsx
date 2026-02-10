import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { Info } from 'lucide-react';

import { useTheme } from '../../theme/ThemeProvider';
import { useRealmClient } from '@/app/providers/RealtimeProvider';
import { LobbySnapshot } from './types';
import { PartyMemberCard } from './components/PartyMemberCard';
import { RealmPortalCard } from './components/RealmPortalCard';
import { GMPanel } from './components/GMPanel';
import { ConnectionBanner } from './components/ConnectionBanner';
import { QuestList } from './components/QuestList';
import { RealmSettingsDialog } from './components/RealmSettingsDialog';
import { PageShell } from '../../components/shell/PageShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Panel } from '../../components/ui/Panel';
import { SummoningCircle } from '../../components/ui/SummoningCircle';
import { BackButton } from '../../components/ui/BackButton';
import { Button } from '../../components/Button';
import { EmojiPicker } from '../../components/ui/EmojiPicker';
import { useThemeMode } from '@/theme/ThemeModeProvider';
import styles from './lobby.module.css';
import type { RealmStateDto } from '../../types/realm';

function LobbySkeleton() {
    return (
        <div className={styles.panelGrid}>
            {[1, 2, 3].map((panel) => (
                <div key={panel} className="space-y-4 animate-pulse">
                    <div className="h-10 w-40 bg-pr-surface-2 rounded-md" />
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-pr-surface-2 rounded-xl" />)}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TavernLobbyPage() {
    const params = useParams<{ code: string }>();
    const realmCode = params.code;

    const navigate = useNavigate();
    const { setThemeKey } = useTheme();
    const client = useRealmClient();
    const prefersReducedMotion = useReducedMotion() ?? false;
    const { mode } = useThemeMode();

    const [snapshot, setSnapshot] = useState<LobbySnapshot | null>(null);
    const [status, setStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'disconnected'>('connecting');
    const [showSettings, setShowSettings] = useState(false);

    const connectToRealm = useCallback(async () => {
        if (!realmCode) return;
        const token = sessionStorage.getItem(`pointrealm:v1:realm:${realmCode}:token`);
        if (!token) {
            navigate(`/join?realmCode=${realmCode}`);
            return;
        }

        try {
            setStatus('connecting');
            await client.connect({ realmCode, memberToken: token });
            await client.joinPresence();
            setStatus('connected');
        } catch (err) {
            console.error("Lobby Connection Failed:", err);
            setStatus('disconnected');
        }
    }, [realmCode, navigate, client]);

    useEffect(() => {
        if (!realmCode) {
            navigate('/join');
            return;
        }

        const onSnapshot = (data: LobbySnapshot) => {
            setSnapshot(data);
            if (mode.useRealmTheme && data.realm.themeKey) {
                setThemeKey(data.realm.themeKey);
            }
            if (data.activeEncounterId) {
                navigate(`/realm/${realmCode}`);
            }
        };

        const onStateUpdated = (state: RealmStateDto) => {
            if (state.encounter) {
                navigate(`/realm/${realmCode}`);
            }
        };

        const unsubscribeSnapshot = client.on('realmSnapshot', onSnapshot);
        const unsubscribeState = client.on('realmStateUpdated', onStateUpdated);
        const unsubscribeStatus = client.on('connectionStatusChanged', (nextStatus) => {
            if (nextStatus === 'connected') {
                client.joinPresence().catch(console.error);
            }
            setStatus(nextStatus === 'error' ? 'disconnected' : nextStatus);
        });

        connectToRealm();

        return () => {
            client.leavePresence().catch(() => undefined);
            unsubscribeSnapshot();
            unsubscribeState();
            unsubscribeStatus();
        };
    }, [realmCode, connectToRealm, setThemeKey, navigate, client, mode.useRealmTheme]);

    if (!snapshot) {
        return (
            <PageShell
                backgroundDensity="medium"
                reducedMotion={prefersReducedMotion}
                contentClassName={styles.page}
            >
                <ConnectionBanner isConnecting={status !== 'disconnected'} onRetry={connectToRealm} />
                <div className={styles.shell}>
                    <PageHeader
                        title={mode.phrases.lobbyTitle}
                        subtitle={mode.phrases.lobbySubtitle}
                        size="panel"
                        className={styles.header || ''}
                    />
                    <div className="mt-2">
                        {status === 'disconnected' ? (
                            <Panel className="max-w-md mx-auto text-center py-12">
                                <h2 className="text-xl font-bold text-pr-danger mb-2">{mode.phrases.connectionLostTitle}</h2>
                                <p className="text-pr-text-muted mb-6 px-4">{mode.phrases.connectionLostBody}</p>
                                <button onClick={connectToRealm} className="px-6 py-3 bg-pr-primary text-pr-bg rounded-lg font-bold hover:shadow-lg transition-all">
                                    {mode.phrases.restoreConnection}
                                </button>
                            </Panel>
                        ) : (
                            <LobbySkeleton />
                        )}
                    </div>
                </div>
            </PageShell>
        );
    }

    const me = snapshot.me;
    const isGM = me.role === 'GM';
    const gmName = snapshot.party.find(member => member.role === 'GM')?.displayName || me.displayName;
    const currentMember = snapshot.party.find(member => member.memberId === me.memberId);
    const currentEmoji = currentMember?.avatarEmoji ?? null;

    const handleAvatarEmojiSelect = async (emoji: string) => {
        if (!currentMember || emoji === currentEmoji) return;
        try {
            await client.setAvatarEmoji({ emoji });
        } catch (err) {
            console.error("Failed to update avatar emoji", err);
        }
    };

    return (
        <PageShell
            backgroundDensity="medium"
            backgroundVariant="realm"
            reducedMotion={prefersReducedMotion}
            contentClassName={styles.page}
        >
            {mode.showBackdrop && <SummoningCircle />}
            <BackButton to="/" />
            
            {status !== 'connected' && (
                <ConnectionBanner 
                    isConnecting={status === 'connecting' || status === 'reconnecting'} 
                    onRetry={connectToRealm} 
                />
            )}

            <div className={styles.shell}>
                <PageHeader
                    title={mode.phrases.lobbyTitle}
                    subtitle={mode.phrases.lobbySubtitle}
                    size="panel"
                    className={styles.header || ''}
                />

                <div className={styles.panelGrid}>
                    <Panel variant="realm" className={`${styles.panel} ${styles.panelParty}`}>
                        <div className={styles.panelHeader}>
                            <SectionHeader 
                                title={mode.phrases.partyTitle} 
                                subtitle={mode.phrases.partySubtitle}
                                className="mb-0"
                            />
                        </div>

                        <div className={styles.panelBody}>
                            {currentMember && (
                                <Panel variant="default" className="mb-4 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.3em] text-pr-text-muted/70">
                                                {mode.phrases.sigilTitle}
                                            </p>
                                            <p className="text-xs text-pr-text-muted">
                                                {mode.phrases.sigilSubtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <EmojiPicker
                                        selectedEmoji={currentEmoji}
                                        onSelect={handleAvatarEmojiSelect}
                                        disabled={status !== 'connected'}
                                    />
                                </Panel>
                            )}
                            <div className={styles.memberList}>
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {snapshot.party.map((member) => (
                                        <PartyMemberCard key={member.memberId} member={member} />
                                    ))}
                                </AnimatePresence>

                                {snapshot.party.length === 0 && (
                                    <Panel variant="default" className="py-12 text-center italic text-pr-text-muted">
                                        <Info size={32} className="mx-auto mb-3 opacity-20" />
                                        <p>The tavern is empty. Only whispers of previous quests remain...</p>
                                    </Panel>
                                )}
                            </div>
                        </div>
                    </Panel>


                    <QuestList
                        quests={snapshot.questLogSummary.quests || []}
                        questLogVersion={snapshot.questLogSummary.questLogVersion}
                        canReorder={isGM}
                        isConnected={status === 'connected'}
                    />

                    <RealmPortalCard
                        joinUrl={snapshot.portal.joinUrl}
                        className={`${styles.panel} ${styles.panelPortal}`}
                    />

                    {isGM && (
                        <GMPanel 
                            activeQuestId={snapshot.questLogSummary.activeQuestId}
                            quests={snapshot.questLogSummary.quests || []}
                            onManageSettings={() => setShowSettings(true)}
                            gmName={gmName}
                            joinUrl={snapshot.portal.joinUrl}
                            partyCount={snapshot.party.length}
                            questCount={snapshot.questLogSummary.totalQuests}
                            {...(snapshot.activeEncounterId ? { activeEncounterId: snapshot.activeEncounterId } : {})}
                            className={`${styles.panel} ${styles.panelGM}`}
                        />
                    )}
                </div>

                <div className={styles.footerRow}>
                    {/* Back button handled by BackButton top-left, but 'Leave Realm' might be clearer here? */}
                    <Button
                        variant="ghost"
                        className="min-w-[160px] uppercase tracking-[0.15em] text-[10px] opacity-60 hover:opacity-100"
                        onClick={() => navigate('/')}
                    >
                        Exit to Tavern
                    </Button>
                    <Button
                        variant="primary"
                        className="min-w-[180px] uppercase tracking-widest text-xs"
                        onClick={() => realmCode && navigate(`/realm/${realmCode}`)}
                    >
                        {isGM ? 'Start Realm' : 'Join Realm'}
                    </Button>
                </div>
            </div>

            {showSettings && isGM && (
                <RealmSettingsDialog 
                    realmCode={snapshot.realm.code}
                    currentSettings={snapshot.realm.settings}
                    currentThemeKey={snapshot.realm.themeKey}
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </PageShell>
    );
}
