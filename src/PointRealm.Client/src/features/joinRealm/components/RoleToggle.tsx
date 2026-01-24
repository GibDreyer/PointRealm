import { Eye, User } from 'lucide-react';

export type RealmRole = 'participant' | 'observer' | 'gm';

interface RoleToggleProps {
    value: RealmRole;
    onChange: (role: RealmRole) => void;
    disabled?: boolean;
}

export function RoleToggle({ value, onChange, disabled }: RoleToggleProps) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--pr-text-muted)] block">
                Your Role
            </label>
            <div className="bg-[var(--pr-bg)] p-1 rounded-[var(--pr-radius-md)] border border-[var(--pr-border)] flex">
                <button
                    type="button"
                    onClick={() => onChange('participant')}
                    disabled={disabled}
                    className={`
                        flex-1 py-2 px-3 rounded-[var(--pr-radius-sm)] text-sm font-medium flex items-center justify-center gap-2 transition-all
                        ${value === 'participant' 
                            ? 'bg-[var(--pr-surface-elevated)] text-[var(--pr-primary)] shadow-sm' 
                            : 'text-[var(--pr-text-muted)] hover:text-[var(--pr-text)]'
                        }
                    `}
                >
                    <User size={16} />
                    Participant
                </button>
                <button
                    type="button"
                    onClick={() => onChange('observer')}
                    disabled={disabled}
                    className={`
                        flex-1 py-2 px-3 rounded-[var(--pr-radius-sm)] text-sm font-medium flex items-center justify-center gap-2 transition-all
                        ${value === 'observer' 
                            ? 'bg-[var(--pr-surface-elevated)] text-[var(--pr-primary)] shadow-sm' 
                            : 'text-[var(--pr-text-muted)] hover:text-[var(--pr-text)]'
                        }
                    `}
                >
                    <Eye size={16} />
                    Observer
                </button>
            </div>
            <p className="text-xs text-[var(--pr-text-muted)]">
                {value === 'observer' ? "Observers can watch the session but cannot cast votes." : "Participants cast votes and participate in the estimation."}
            </p>
        </div>
    );
}
