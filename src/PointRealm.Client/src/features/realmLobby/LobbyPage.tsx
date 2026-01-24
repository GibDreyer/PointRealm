import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Users, Info } from 'lucide-react';

import { getClientId } from '../../lib/storage';
import { useTheme } from '../../theme/ThemeProvider';
import { hub } from '../../realtime/hub';
import { LobbySnapshot } from './types';
import { PartyMemberCard } from './components/PartyMemberCard';
import { RealmPortalCard } from './components/RealmPortalCard';
import { GMPanel } from './components/GMPanel';
import { ConnectionBanner } from './components/ConnectionBanner';
import { IdentityCard } from './components/IdentityCard';
import { RealmSettingsDialog } from './components/RealmSettingsDialog';
import { RealmShell } from '../../app/layouts/RealmShell';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Panel } from '../../components/ui/Panel';

function LobbySkeleton() {
    return (
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 animate-pulse">
             <div className="space-y-6">
                 <div className="h-12 w-64 bg-pr-surface-2 rounded-md" />
                 <div className="space-y-3">
                     {[1,2,3,4].map(i => <div key={i} className="h-20 bg-pr-surface-2 rounded-xl" />)}
                 </div>
             </div>
             <div className="space-y-6">
                 <div className="h-40 bg-pr-surface-2 rounded-xl" />
                 <div className="h-32 bg-pr-surface-2 rounded-xl" />
             </div>
        </div>
    );
}

export function TavernLobbyPage() {
    const params = useParams<{ code: string }>();
    const realmCode = params.code;
    
    const navigate = useNavigate();
    const { setThemeKey } = useTheme();

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
            <RealmShell>
                <div className="w-full pt-12">
                    <ConnectionBanner isConnecting={status !== 'disconnected'} onRetry={connectToRealm} />
                    <div className="mt-8">
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
            </RealmShell>
        );
    }

    const me = snapshot.me;
    const isGM = me.role === 'GM';
    const onlineCount = snapshot.party.filter(p => p.presence === 'Online').length;

    return (
        <RealmShell>
            {/* Connection Banner */}
            {status !== 'connected' && (
                <ConnectionBanner 
                    isConnecting={status === 'connecting' || status === 'reconnecting'} 
                    onRetry={connectToRealm} 
                />
            )}

            <div className="w-full max-w-6xl mx-auto pt-6 flex flex-col gap-8">
                {/* 3-Panel Balanced Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                    
                    {/* Main Area: Party Roster */}
                    <div className="space-y-6">
                        <header className="flex items-end justify-between px-2">
                            <SectionHeader 
                                title="Tavern Lobby" 
                                subtitle={`${snapshot.realm.name} — ${onlineCount} active member${onlineCount !== 1 ? 's' : ''}`}
                                className="mb-0"
                            />
                            <div className="flex items-center gap-2 text-pr-text-muted bg-pr-surface-2 px-3 py-1.5 rounded-full border border-pr-border/30 mb-1">
                                <Users size={14} className="text-pr-primary" />
                                <span className="text-[10px] uppercase font-black tracking-widest">{onlineCount} / {snapshot.party.length}</span>
                            </div>
                        </header>

                        <div className="grid gap-3">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {snapshot.party.map((member) => (
                                    <PartyMemberCard key={member.memberId} member={member} />
                                ))}
                            </AnimatePresence>
                             
                            {snapshot.party.length === 0 && (
                                 <Panel variant="subtle" className="py-16 text-center italic text-pr-text-muted">
                                     <Info size={32} className="mx-auto mb-3 opacity-20" />
                                     <p>The tavern is empty. Only whispers of previous quests remain...</p>
                                 </Panel>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Area: Controls & Info */}
                    <aside className="space-y-6">
                         <IdentityCard currentName={me.displayName} />

                         {isGM && (
                             <GMPanel 
                                activeQuestId={snapshot.questLogSummary.activeQuestId}
                                quests={snapshot.questLogSummary.quests || []}
                                onManageSettings={() => setShowSettings(true)}
                             />
                         )}

                         <RealmPortalCard joinUrl={snapshot.portal.joinUrl} />
                    </aside>
                </div>
            </div>

            {/* Dialogs */}
            {showSettings && isGM && (
                <RealmSettingsDialog 
                    realmCode={snapshot.realm.code}
                    currentSettings={snapshot.realm.settings}
                    currentThemeKey={snapshot.realm.themeKey}
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}
        </RealmShell>
    );
}
