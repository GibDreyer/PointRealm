import { PartyMember } from '../../../types/realm';
import { Crown, WifiOff } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { motion, AnimatePresence } from 'framer-motion';

interface PartyRosterPanelProps {
    members: PartyMember[];
    currentMemberId: string;
    hideVoteCounts: boolean;
    encounterStatus?: 'idle' | 'voting' | 'revealed' | 'sealed';
}

export function PartyRosterPanel({ members, currentMemberId, hideVoteCounts, encounterStatus }: PartyRosterPanelProps) {
    const sortedMembers = [...members].sort((a, b) => {
        if (a.role === 'GM' && b.role !== 'GM') return -1;
        if (a.role !== 'GM' && b.role === 'GM') return 1;
        if (a.id === currentMemberId) return -1;
        if (b.id === currentMemberId) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="flex flex-col h-full">
            <header className="p-5 border-b border-pr-border/20 bg-pr-surface/40">
                <SectionHeader
                    title="Party"
                    subtitle="Presence"
                    className="mb-0 [&_h2]:text-lg"
                />
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {sortedMembers.map(member => {
                        const isSelf = member.id === currentMemberId;
                        const isGM = member.role === 'GM';
                        const isOnline = member.isOnline;
                        const statusText = !isOnline
                            ? 'Disconnected'
                            : member.status === 'ready'
                                ? 'Voted'
                                : member.status === 'choosing'
                                    ? 'Choosing rune'
                                    : 'Waiting';
                        
                        return (
                            <motion.div
                                key={member.id}
                                layout
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: isOnline ? 1 : 0.5, x: 0 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className={cn(
                                            "w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300",
                                            isGM ? "bg-pr-secondary/5 border-pr-secondary/40 text-pr-secondary" :
                                            isSelf ? "bg-pr-primary/5 border-pr-primary/40 text-pr-primary" :
                                            "bg-pr-surface/60 border-pr-border/30 text-pr-text-muted/70"
                                        )}>
                                            <span className="text-xs font-bold tracking-wide uppercase">{member.name.substring(0, 2)}</span>
                                        </div>
                                        {isGM && (
                                            <div className="absolute -top-1 -right-1 text-pr-secondary bg-pr-bg rounded-full border border-pr-secondary/40 p-1">
                                                <Crown size={10} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "font-semibold text-sm uppercase tracking-widest truncate",
                                                isSelf ? "text-pr-primary/80" : isOnline ? "text-pr-text/80" : "text-pr-text-muted/50"
                                            )}>
                                                {member.name}
                                            </span>
                                            {isGM && (
                                                <span className="text-[8px] uppercase tracking-[0.25em] text-pr-secondary/70 border border-pr-secondary/30 rounded-full px-2 py-0.5">
                                                    GM
                                                </span>
                                            )}
                                            {isSelf && <span className="text-[8px] uppercase tracking-[0.2em] text-pr-primary/40">Self</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {!isOnline ? (
                                                <span className="text-[9px] text-pr-danger/50 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                                    <WifiOff size={10} /> {statusText}
                                                </span>
                                            ) : (
                                                <span className={cn(
                                                    "text-[9px] uppercase tracking-[0.25em]",
                                                    member.status === 'ready' ? "text-pr-primary/70" : "text-pr-text-muted/60"
                                                )}>
                                                    {statusText}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {encounterStatus === 'voting' && hideVoteCounts && (
                    <p className="text-[9px] uppercase tracking-[0.35em] text-pr-text-muted/60 text-center pt-2">
                        Votes hidden
                    </p>
                )}
            </div>
        </div>
    );
}
