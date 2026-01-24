import { motion } from 'framer-motion';
import { User, Crown, Sword, Scroll, Wand2 } from 'lucide-react';
import { PartyMember } from '../types';

interface Props {
    member: PartyMember;
}

// Simple mapping for badge keys (future proofing)
const getIcon = (key?: string) => {
    switch (key) {
        case 'warrior': return <Sword size={20} />;
        case 'mage': return <Wand2 size={20} />;
        case 'scholar': return <Scroll size={20} />;
        default: return <User size={20} />;
    }
};

export function PartyMemberCard({ member }: Props) {
    const isOffline = member.presence === 'Offline';
    
    // Status Logic
    let statusText = "In Tavern";
    let statusColor = "text-[var(--pr-text-muted)]";
    let statusBg = "bg-[var(--pr-surface-hover)]";

    if (isOffline) {
        statusText = "Disconnected";
        statusColor = "text-[var(--pr-text-muted)]"; 
        statusBg = "bg-[var(--pr-bg)]";
    } else {
        if (member.voteState === 'LockedIn') {
            statusText = "Ready";
            statusColor = "text-[var(--pr-success)]";
            statusBg = "bg-[var(--pr-success)]/15";
        } else if (member.voteState === 'Choosing') {
            statusText = "Choosing rune";
            statusColor = "text-[var(--pr-primary)]";
            statusBg = "bg-[var(--pr-primary)]/15";
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -15 }}
            animate={{ 
                opacity: isOffline ? 0.6 : 1, 
                x: 0,
                filter: isOffline ? 'grayscale(60%)' : 'none'
            }}
            exit={{ opacity: 0 }}
            transition={{ 
                layout: { duration: 0.2 },
                opacity: { duration: 0.25 },
                x: { duration: 0.25, ease: "easeOut" }
            }}
            className="flex items-center gap-4 p-3 rounded-[var(--pr-radius-lg)] border border-[var(--pr-border)] bg-[var(--pr-surface)] shadow-sm relative overflow-hidden group"
        >
            {/* Class Icon */}
            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border border-[var(--pr-border)] transition-colors
                ${isOffline ? 'bg-[var(--pr-bg)] text-[var(--pr-text-muted)]' : 'bg-[var(--pr-bg)] text-[var(--pr-primary)]'}
            `}>
                {member.isGM ? <Crown size={20} /> : getIcon(member.classBadgeKey)}
            </div>
            
            {/* Name */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--pr-text)] truncate text-base" title={member.displayName}>
                        {member.displayName}
                    </span>
                    {member.isGM && (
                       <span className="text-[10px] font-bold font-mono tracking-wider uppercase bg-[var(--pr-primary)] text-[var(--pr-bg)] px-1.5 py-0.5 rounded-[var(--pr-radius-sm)]">GM</span>
                    )}
                </div>
            </div>

            {/* Status Pill */}
            <div className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border border-transparent ${statusBg} ${statusColor}`}>
                {statusText}
            </div>
        </motion.div>
    );
}
