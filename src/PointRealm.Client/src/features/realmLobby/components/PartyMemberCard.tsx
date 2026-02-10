import { motion } from 'framer-motion';
import { User, Crown, Sword, Scroll, Wand2 } from 'lucide-react';
import { PartyMember } from '../types';
import { Panel } from '../../../components/ui/Panel';
import { cn } from '../../../lib/utils';
import { resolveMemberAvatar } from '@/lib/memberAvatar';

interface Props {
    member: PartyMember;
}

const getIcon = (key?: string) => {
    switch (key) {
        case 'warrior': return <Sword size={18} />;
        case 'mage': return <Wand2 size={18} />;
        case 'scholar': return <Scroll size={18} />;
        default: return <User size={18} />;
    }
};

export function PartyMemberCard({ member }: Props) {
    const isOffline = member.presence === 'Offline';
    const { imageUrl: avatarImageUrl, emoji: avatarEmoji } = resolveMemberAvatar(member);
    
    let statusText = "Ready";
    let statusClasses = "text-pr-success";
    let statusDot = "bg-pr-primary/50";

    if (isOffline) {
        statusText = "Disconnected";
        statusClasses = "text-pr-text-muted/60";
        statusDot = "bg-pr-border/60";
    } else {
        if (member.voteState === 'Choosing') {
            statusText = "Choosing rune";
            statusClasses = "text-pr-primary";
        } else if (member.voteState !== 'LockedIn') {
            statusText = "Ready";
            statusClasses = "text-pr-text-muted";
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ 
                opacity: isOffline ? 0.5 : 1, 
                y: 0,
                scale: isOffline ? 0.98 : 1
            }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="group"
        >
            <Panel 
                variant="default" 
                className={cn(
                    "flex items-center gap-4 p-3 transition-all border border-pr-border/10 bg-pr-surface/40 hover:bg-pr-surface/60",
                    !isOffline && "group-hover:border-pr-primary/30 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.05)]",
                    isOffline && "opacity-60 grayscale"
                )}
            >
                {/* Class Icon */}
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border transition-all shrink-0",
                    isOffline 
                        ? "bg-pr-bg border-pr-border/20 text-pr-text-muted/40" 
                        : "bg-pr-bg border-pr-border/40 text-pr-text-muted/80"
                )}>
                    {avatarImageUrl ? (
                        <img
                            src={avatarImageUrl}
                            alt={`${member.displayName} avatar`}
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : avatarEmoji ? (
                        <span className="text-lg" aria-label={`${member.displayName} avatar`}>
                            {avatarEmoji}
                        </span>
                    ) : member.isGM ? (
                        <Crown size={20} className="text-pr-text-muted/80" />
                    ) : (
                        getIcon(member.classBadgeKey)
                    )}
                </div>
                
                {/* Name */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "font-bold truncate text-[0.95rem] font-heading tracking-wide",
                            isOffline ? "text-pr-text-muted" : "text-pr-text"
                        )} title={member.displayName}>
                            {member.displayName}
                        </span>
                        {member.isGM && (
                           <span className="text-[8px] font-black tracking-widest uppercase bg-pr-secondary/10 border border-pr-secondary/30 text-pr-secondary px-1.5 py-0.5 rounded-sm">GM</span>
                        )}
                    </div>
                    <span className={cn(
                        "text-[10px] uppercase tracking-[0.15em] font-bold opacity-70",
                        statusClasses
                    )}>
                        {statusText}
                    </span>
                </div>

                {/* Status Pill */}
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-pr-text-muted">
                    <span className={cn("w-2 h-2 rounded-full", statusDot)} />
                </div>
            </Panel>
        </motion.div>
    );
}
