import { PartyMember } from '../../../types/realm';
import { Users, Crown, WifiOff } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface PartyRosterPanelProps {
    members: PartyMember[];
    currentMemberId: string;
    hideVoteCounts: boolean;
    encounterStatus?: 'idle' | 'voting' | 'revealed' | 'sealed';
}

export function PartyRosterPanel({ members, currentMemberId, hideVoteCounts, encounterStatus }: PartyRosterPanelProps) {
    // Sort: GM first, then Self, then others
    const sortedMembers = [...members].sort((a, b) => {
        if (a.role === 'GM' && b.role !== 'GM') return -1;
        if (a.role !== 'GM' && b.role === 'GM') return 1;
        if (a.id === currentMemberId) return -1;
        if (b.id === currentMemberId) return 1;
        return a.name.localeCompare(b.name);
    });

    const votingCount = members.filter(m => m.status === 'ready').length;
    
    return (
        <div className="flex flex-col h-full bg-[var(--pr-surface-dim)]/50 backdrop-blur-md border-l border-[var(--pr-border)]">
            <header className="p-4 border-b border-[var(--pr-border)] flex items-center justify-between sticky top-0 bg-[var(--pr-surface-dim)] z-10">
                <div className="flex items-center gap-2 text-[var(--pr-secondary)]">
                    <Users className="w-5 h-5" />
                    <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--pr-heading-font)' }}>Travelers</h2>
                </div>
                <div className="text-xs font-mono text-[var(--pr-text-muted)] bg-[var(--pr-surface)] px-2 py-1 rounded">
                    {members.length} Online
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                 {/* Vote Status Summary */}
                 {encounterStatus === 'voting' && (
                    <div className="mb-4 p-3 bg-[var(--pr-surface)] rounded-lg border border-[var(--pr-border)] text-center">
                        {hideVoteCounts ? (
                             <p className="text-sm text-[var(--pr-text-muted)] animate-pulse">Waiting for the party...</p>
                        ) : (
                             <p className="text-sm">
                                <span className="font-bold text-[var(--pr-text)]">{votingCount}</span>
                                <span className="text-[var(--pr-text-muted)]"> of </span>
                                <span className="font-bold text-[var(--pr-text)]">{members.length}</span>
                                <span className="text-[var(--pr-text-muted)]"> have chosen</span>
                             </p>
                        )}
                    </div>
                 )}

                 <div className="space-y-1">
                    {sortedMembers.map(member => {
                        const isSelf = member.id === currentMemberId;
                        return (
                            <div key={member.id} className={cn(
                                "flex items-center gap-3 p-2 rounded-md transition-colors",
                                isSelf ? "bg-[var(--pr-surface-active)]/50" : "hover:bg-[var(--pr-surface-hover)]"
                            )}>
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-[var(--pr-surface-raised)] border border-[var(--pr-border)] flex items-center justify-center overflow-hidden">
                                        <span className="text-xs font-bold text-[var(--pr-text-muted)]">{member.name.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    {member.role === 'GM' && (
                                        <div className="absolute -top-1 -right-1 text-[var(--pr-accent)] bg-[var(--pr-bg)] rounded-full border border-[var(--pr-border)] p-0.5" title="Game Master">
                                            <Crown className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "font-medium truncate text-sm",
                                            isSelf ? "text-[var(--pr-text)]" : "text-[var(--pr-text-dim)]"
                                        )}>
                                            {member.name} {isSelf && "(You)"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 h-4">
                                        {member.status === 'ready' && encounterStatus === 'voting' && (
                                             <span className="text-[10px] text-[var(--pr-success)] uppercase font-bold tracking-wider flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--pr-success)] animate-pulse" />
                                                Ready
                                             </span>
                                        )}
                                        {member.status === 'choosing' && encounterStatus === 'voting' && (
                                             <span className="text-[10px] text-[var(--pr-text-muted)] italic">Thinking...</span>
                                        )}
                                        {!member.isOnline && (
                                            <span className="text-[10px] text-[var(--pr-destructive)] flex items-center gap-1">
                                                <WifiOff className="w-3 h-3" /> Offline
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                 </div>
            </div>
        </div>
    );
}
