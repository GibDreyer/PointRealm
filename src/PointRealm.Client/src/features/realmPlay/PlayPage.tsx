import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RealmBackground } from '../../components/ui/RealmBackground';
import { BackButton } from '../../components/ui/BackButton';
import { PageShell } from '../../components/shell/PageShell';
import { useReducedMotion } from 'framer-motion';
import { useRealm } from '../../hooks/useRealm';

export function PlayPage() {
    const params = useParams<{ code: string }>();
    const realmCode = params.code;
    const navigate = useNavigate();

    const { state, loading } = useRealm(realmCode);
    const prefersReducedMotion = useReducedMotion() ?? false;

    const connect = useCallback(async () => {
        if (!realmCode) return;
        const token = sessionStorage.getItem(`pointrealm:v1:realm:${realmCode}:token`);
        if (!token) {
            navigate(`/join?realmCode=${realmCode}`);
        }
    }, [realmCode, navigate]);

    useEffect(() => {
        if (!realmCode) return;
        connect();
    }, [realmCode, connect]);

    if (loading && !state) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RealmBackground />
                <div className="text-[var(--pr-primary)] animate-pulse font-bold text-xl">
                    Entering the Realm...
                </div>
            </div>
        );
    }

    const activeQuest = state?.questLog?.quests.find((q) => state.encounter && q.id === state.encounter.questId);

    return (
        <PageShell
            backgroundDensity="medium"
            backgroundVariant="realm"
            reducedMotion={prefersReducedMotion}
        >
            <BackButton to={`/realm/${realmCode}/lobby`} label="Back to Lobby" />
            
            <div className="min-h-screen w-full relative flex flex-col items-center pt-24 px-4 z-10">
                <div className="w-full max-w-5xl">
                    <header className="mb-8 text-center">
                        <h1 className="text-4xl font-bold text-[var(--pr-primary)] mb-2" style={{ fontFamily: 'var(--pr-heading-font)' }}>
                            {activeQuest?.title || "Active Adventure"}
                        </h1>
                        <p className="text-[var(--pr-text-muted)] italic">
                            {activeQuest?.description || "The encounter has begun!"}
                        </p>
                    </header>

                    <div className="bg-[var(--pr-surface)] border border-[var(--pr-border)] rounded-[var(--pr-radius-xl)] p-8 shadow-2xl overflow-hidden relative">
                         {/* Placeholder for the real game board */}
                         <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-[var(--pr-border)] rounded-lg">
                            <div className="text-6xl mb-4">🧙‍♂️</div>
                            <h2 className="text-2xl font-bold text-[var(--pr-text)] mb-2">The Portal is Open</h2>
                            <p className="text-[var(--pr-text-muted)] text-center max-w-md">
                                The Game Master has started the encounter. Soon, you will cast your votes to determine the path forward.
                            </p>
                            
                            <div className="mt-8 flex gap-4">
                                <button 
                                    onClick={() => navigate(`/realm/${realmCode}/lobby`)}
                                    className="px-6 py-2 bg-[var(--pr-surface-hover)] border border-[var(--pr-border)] text-[var(--pr-text)] font-bold rounded-md hover:border-[var(--pr-primary)] transition-all"
                                >
                                    Return to Lobby
                                </button>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
