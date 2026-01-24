import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../../theme/ThemeProvider';
import { hub } from '../../realtime/hub';
import { LobbySnapshot } from './types';
import { PartyMemberCard } from './components/PartyMemberCard';
import { RealmPortalCard } from './components/RealmPortalCard';
import { GMPanel } from './components/GMPanel';
import { ConnectionBanner } from './components/ConnectionBanner';
import { IdentityCard } from './components/IdentityCard';
import { RealmSettingsDialog } from './components/RealmSettingsDialog';
import { RealmBackground } from '../../components/ui/RealmBackground';

// Skeleton Component
function LobbySkeleton() {
    return (
        <div className="w-full max-w-7xl animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">
             <div className="lg:col-span-2 space-y-6">
                 <div className="h-12 w-64 bg-[var(--pr-surface-hover)] rounded-md opacity-50" />
                 <div className="space-y-3">
                     {[1,2,3,4].map(i => <div key={i} className="h-20 bg-[var(--pr-surface-hover)] rounded-[var(--pr-radius-lg)] opacity-50" />)}
                 </div>
             </div>
             <div className="space-y-6">
                 <div className="h-40 bg-[var(--pr-surface-hover)] rounded-[var(--pr-radius-xl)] opacity-50" />
                 <div className="h-32 bg-[var(--pr-surface-hover)] rounded-[var(--pr-radius-xl)] opacity-50" />
             </div>
        </div>
    );
}

// Wrapper for animations
function CardWrapper({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.35, ease: "easeOut" }}
        >
            {children}
        </motion.div>
    );
}

export function LobbyPage() {
    const params = useParams<{ code: string }>();
    const realmCode = params.code; // Router uses :code
    
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
             // Token contains memberId and realmId claims - passed via accessTokenFactory
             await hub.connect(token);
             
             // JoinRealm now only needs the realm code - identity comes from JWT claims
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

        // Setup Listeners
        hub.on('RealmSnapshot', (data: LobbySnapshot) => {
             // console.log("Snapshot", data);
             setSnapshot(data);
             if (data.realm.themeKey) {
                 setThemeKey(data.realm.themeKey);
             }
        });

        hub.on('reconnecting', () => setStatus('reconnecting'));
        
        hub.on('reconnected', () => {
             console.log("Reconnected - rejoining realm...");
             // Re-invoke JoinRealm - identity comes from token
             hub.invoke('JoinRealm', realmCode).catch(console.error);
             setStatus('connected');
        });

        hub.on('close', () => setStatus('disconnected'));

        // Start
        connectToRealm();

        return () => {
            hub.off('RealmSnapshot', () => {});
            hub.stop();
        };
    }, [realmCode, connectToRealm, setThemeKey, navigate]);
    
    // Skeleton while connecting or initial load
    if (!snapshot) {
        return (
            <div className="min-h-screen w-full relative flex flex-col items-center pt-20">
                <RealmBackground />
                <ConnectionBanner isConnecting={status !== 'disconnected'} onRetry={connectToRealm} />
                <div className="z-10 w-full flex justify-center">
                    {status === 'disconnected' ? (
                        <div className="text-center p-8 bg-[var(--pr-surface)] rounded-[var(--pr-radius-xl)] border border-[var(--pr-border)] shadow-lg">
                            <h2 className="text-xl font-bold text-[var(--pr-danger)] mb-2">Connection Lost</h2>
                            <p className="text-[var(--pr-text-muted)] mb-4">The magical currents are too turbulent.</p>
                            <button onClick={connectToRealm} className="px-4 py-2 bg-[var(--pr-primary)] text-[var(--pr-bg)] rounded-[var(--pr-radius-md)] font-bold">
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <LobbySkeleton />
                    )}
                </div>
            </div>
        );
    }

    const me = snapshot.me;
    const isGM = me.role === 'GM';
    const onlineCount = snapshot.party.filter(p => p.presence === 'Online').length;

    return (
        <div className="w-full relative min-h-screen flex flex-col items-center" style={{ fontFamily: 'var(--pr-body-font)' }}>
            <RealmBackground />

            {/* Sticky Banner if issues */}
            {status !== 'connected' && (
                <ConnectionBanner 
                    isConnecting={status === 'connecting' || status === 'reconnecting'} 
                    onRetry={connectToRealm} 
                />
            )}

            <div className="w-full max-w-7xl p-4 md:p-8 z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column (Roster) */}
                    <div className="lg:col-span-2 space-y-6">
                        <header className="mb-6">
                            <h1 className="text-3xl md:text-4xl font-bold text-[var(--pr-primary)] mb-2" style={{ fontFamily: 'var(--pr-heading-font)' }}>
                                Tavern Lobby
                            </h1>
                            <p className="text-[var(--pr-text-muted)] text-lg">
                                Party Roster ({onlineCount} online)
                            </p>
                        </header>

                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {snapshot.party.map((member) => (
                                    <PartyMemberCard key={member.memberId} member={member} />
                                ))}
                            </AnimatePresence>
                             
                            {snapshot.party.length === 0 && (
                                 <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }}
                                    className="p-8 text-center border-2 border-dashed border-[var(--pr-border)] rounded-[var(--pr-radius-lg)] text-[var(--pr-text-muted)] italic"
                                 >
                                     The tavern is empty. Only echoes remain...
                                 </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Controls) */}
                    <div className="space-y-6">
                         <CardWrapper delay={0.05}>
                             <IdentityCard currentName={me.displayName} />
                         </CardWrapper>

                         {isGM && (
                             <CardWrapper delay={0.1}>
                                 <GMPanel 
                                    activeQuestId={snapshot.questLogSummary.activeQuestId}
                                    onManageSettings={() => setShowSettings(true)}
                                 />
                             </CardWrapper>
                         )}

                         <CardWrapper delay={0.2}>
                             <RealmPortalCard joinUrl={snapshot.portal.joinUrl} />
                         </CardWrapper>
                    </div>
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
        </div>
    );
}
