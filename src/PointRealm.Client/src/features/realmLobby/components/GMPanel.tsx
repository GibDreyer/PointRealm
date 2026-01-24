import { Play, Settings } from 'lucide-react';
import { hub } from '../../../realtime/hub';

interface Props {
    activeQuestId: string | undefined;
    onManageSettings: () => void;
}

export function GMPanel({ activeQuestId, onManageSettings }: Props) {
    
    const handleBeginEncounter = () => {
        if (activeQuestId) {
            hub.invoke("StartEncounter", activeQuestId).catch(console.error);
        }
    };

    return (
        <div className="w-full bg-[var(--pr-surface)] border border-[var(--pr-border)] rounded-[var(--pr-radius-xl)] p-5 shadow-[var(--pr-shadow-soft)] mt-4 border-l-4 border-l-[var(--pr-primary)]">
            <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--pr-primary)] mb-0.5">
                    Game Master
                </h3>
                <p className="text-xs text-[var(--pr-text-muted)]">Facilitator Controls</p>
            </div>

            <div className="space-y-3">
                <button
                    onClick={handleBeginEncounter}
                    disabled={!activeQuestId}
                    className="w-full py-3 px-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-primary)] text-[var(--pr-bg)] font-bold text-sm shadow-[var(--pr-shadow-soft)] hover:shadow-[var(--pr-shadow-hover)] hover:translate-y-[-1px] active:translate-y-[0px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    aria-label="Begin Encounter"
                >
                    <Play size={16} fill="currentColor" />
                    Begin Encounter
                </button>

                <button
                    onClick={onManageSettings}
                    className="w-full py-3 px-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-surface-hover)] border border-[var(--pr-border)] text-[var(--pr-text)] font-medium text-sm hover:border-[var(--pr-text-muted)] transition-all flex items-center justify-center gap-2"
                    aria-label="Manage Realm Settings"
                >
                    <Settings size={16} />
                    Realm Settings
                </button>
            </div>

            {!activeQuestId && (
                <p className="mt-3 text-xs text-[var(--pr-text-muted)] text-center italic">
                    Select or create a quest to begin.
                </p>
            )}
        </div>
    );
}
