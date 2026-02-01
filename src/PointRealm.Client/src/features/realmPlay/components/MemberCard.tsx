import { motion } from 'framer-motion';
import { Crown, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PartyMember } from '@/types/realm';

interface MemberCardProps {
    /** The party member data */
    member: PartyMember;
    /** Whether this is the current user */
    isSelf: boolean;
}

/**
 * A party member card showing avatar, name, role, and status.
 */
export function MemberCard({ member, isSelf }: MemberCardProps) {
    const isGM = member.role === 'GM';
    const isOnline = member.isOnline;
    const avatarEmoji = member.avatarEmoji?.trim();
    
    const statusText = !isOnline
        ? 'Disconnected'
        : member.status === 'ready'
            ? 'Voted'
            : member.status === 'choosing'
                ? 'Choosing rune'
                : 'Waiting';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: isOnline ? 1 : 0.5, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="group"
        >
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                    <div className={cn(
                        "w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300",
                        isGM ? "bg-pr-secondary/5 border-pr-secondary/40 text-pr-secondary" :
                        isSelf ? "bg-pr-primary/5 border-pr-primary/40 text-pr-primary" :
                        "bg-pr-surface/60 border-pr-border/30 text-pr-text-muted/70"
                    )}>
                        {avatarEmoji ? (
                            <span className="text-lg" aria-label={`${member.name} avatar`}>
                                {avatarEmoji}
                            </span>
                        ) : (
                            <span className="text-xs font-bold tracking-wide uppercase">
                                {member.name.substring(0, 2)}
                            </span>
                        )}
                    </div>
                    {isGM && (
                        <div className="absolute -top-1 -right-1 text-pr-secondary bg-pr-bg rounded-full border border-pr-secondary/40 p-1">
                            <Crown size={10} fill="currentColor" />
                        </div>
                    )}
                </div>

                {/* Name and Status */}
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
                        {isSelf && (
                            <span className="text-[8px] uppercase tracking-[0.2em] text-pr-primary/40">
                                Self
                            </span>
                        )}
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
}
