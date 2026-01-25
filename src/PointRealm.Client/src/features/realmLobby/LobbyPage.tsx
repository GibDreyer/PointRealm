import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { Info } from 'lucide-react';

import { getClientId } from '../../lib/storage';
import { useTheme } from '../../theme/ThemeProvider';
import { hub } from '../../realtime/hub';
import { LobbySnapshot } from './types';
import { PartyMemberCard } from './components/PartyMemberCard';
import { RealmPortalCard } from './components/RealmPortalCard';
import { GMPanel } from './components/GMPanel';
import { ConnectionBanner } from './components/ConnectionBanner';
import { RealmSettingsDialog } from './components/RealmSettingsDialog';
import { PageShell } from '../../components/shell/PageShell';
import { PageHeader } from '../../components/ui/PageHeader';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Panel } from '../../components/ui/Panel';
import { SummoningCircle } from '../../components/ui/SummoningCircle';
import { RealmBackButton } from '../../components/ui/RealmBackButton';
import { Button } from '../../components/Button';
import styles from './lobby.module.css';

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
    const prefersReducedMotion = useReducedMotion() ?? false;

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
            const clientId = getClientId();
            await hub.connect(token, clientId);
            await hub.invoke('JoinRealm', realmCode);
            setStatus('connected');
        } catch (err) {
            console.error("Lobby Connection Failed:", err);
            setStatus('disconnected');
        }
    }, [realmCode, navigate]);

    useEffect(() => {
        if (!realmCode) {
            navigate('/join');
            return;
        }

        const onSnapshot = (data: LobbySnapshot) => {
            setSnapshot(data);
            if (data.realm.themeKey) {
                setThemeKey(data.realm.themeKey);
            }
            if (data.activeEncounterId) {
                navigate(`/realm/${realmCode}`);
            }
        };

        const onStateUpdated = (state: any) => {
            if (state.encounter) {
                navigate(`/realm/${realmCode}`);
            }
        };

        const onReconnecting = () => setStatus('reconnecting');
        const onReconnected = () => {
            hub.invoke('JoinRealm', realmCode).catch(console.error);
            setStatus('connected');
        };
        const onClose = () => setStatus('disconnected');

        hub.on('RealmSnapshot', onSnapshot);
        hub.on('RealmStateUpdated', onStateUpdated);
        hub.on('reconnecting', onReconnecting);
        hub.on('reconnected', onReconnected);
        hub.on('close', onClose);

        connectToRealm();

        return () => {
            hub.off('RealmSnapshot', onSnapshot);
            hub.off('RealmStateUpdated', onStateUpdated);
            hub.off('reconnecting', onReconnecting);
            hub.off('reconnected', onReconnected);
            hub.off('close', onClose);
        };
    }, [realmCode, connectToRealm, setThemeKey, navigate]);

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
                        title="Tavern"
                        subtitle="Realm Lobby"
                        size="panel"
                        className={styles.header || ''}
                    />
                    <div className="mt-2">
                        {status === 'disconnected' ? (
                            <Panel className="max-w-md mx-auto text-center py-12">
                                <h2 className="text-xl font-bold text-pr-danger mb-2">Connection Lost</h2>
                                <p className="text-pr-text-muted mb-6 px-4">The magical currents are too turbulent. Your connection to the realm has faded.</p>
                                <button onClick={connectToRealm} className="px-6 py-3 bg-pr-primary text-pr-bg rounded-lg font-bold hover:shadow-lg transition-all">
                                    Restore Connection
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
    const gmName = snapshot.party.find(member => member.isGM)?.displayName || me.displayName;

    return (
        <PageShell
            backgroundDensity="medium"
            backgroundVariant="realm"
            reducedMotion={prefersReducedMotion}
            contentClassName={styles.page}
        >
            <SummoningCircle />
            <RealmBackButton to="/" />
            
            {status !== 'connected' && (
                <ConnectionBanner 
                    isConnecting={status === 'connecting' || status === 'reconnecting'} 
                    onRetry={connectToRealm} 
                />
            )}

            <div className={styles.shell}>
                <PageHeader
                    title="Tavern"
                    subtitle="Realm Lobby"
                    size="panel"
                    className={styles.header || ''}
                />

                <div className={styles.panelGrid}>
                    <Panel variant="realm" className={`${styles.panel} ${styles.panelParty}`}>
                        <div className={styles.panelHeader}>
                            <SectionHeader 
                                title="Party" 
                                subtitle="Members"
                                className="mb-0"
                            />
                        </div>

                        <div className={styles.panelBody}>
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
                            className={`${styles.panel} ${styles.panelGM}`}
                        />
                    )}
                </div>

                <div className={styles.footerRow}>
                    {/* Back button handled by RealmBackButton top-left, but 'Leave Realm' might be clearer here? 
                        The original button was 'Back to Tavern'. keeping it for accessibility/clarity at bottom of flow
                        but using Ghost variant of Button */}
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
