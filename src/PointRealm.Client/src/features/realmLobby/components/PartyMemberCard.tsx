import { motion } from 'framer-motion';
import { User, Crown, Sword, Scroll, Wand2 } from 'lucide-react';
import { PartyMember } from '../types';
import { Panel } from '../../../components/ui/Panel';
import { cn } from '../../../lib/utils';

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
    
    let statusText = "In Tavern";
    let statusClasses = "text-pr-text-muted border-pr-border/30 bg-pr-surface-2";

    if (isOffline) {
        statusText = "Disconnected";
        statusClasses = "text-pr-text-muted/50 border-pr-border/10 bg-pr-bg opacity-50";
    } else {
        if (member.voteState === 'LockedIn') {
            statusText = "Ready";
            statusClasses = "text-pr-success border-pr-success/30 bg-pr-success/10 shadow-[0_0_10px_-2px_rgba(34,197,94,0.2)]";
        } else if (member.voteState === 'Choosing') {
            statusText = "Choosing rune";
            statusClasses = "text-pr-primary border-pr-primary/30 bg-pr-primary/10 animate-pulse";
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ 
                opacity: isOffline ? 0.5 : 1, 
                x: 0,
                scale: isOffline ? 0.98 : 1
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group"
        >
            <Panel 
                variant={isOffline ? 'subtle' : 'default'} 
                noPadding
                className={cn(
                    "flex items-center gap-4 p-3 transition-all",
                    !isOffline && "group-hover:translate-x-1 group-hover:border-pr-primary/30",
                    isOffline && "grayscale"
                )}
            >
                {/* Class Icon */}
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border transition-all shrink-0",
                    isOffline 
                        ? "bg-pr-bg border-pr-border/20 text-pr-text-muted/40" 
                        : "bg-pr-bg border-pr-primary/20 text-pr-primary group-hover:border-pr-primary group-hover:shadow-[0_0_15px_-5px_rgba(6,182,212,0.5)]"
                )}>
                    {member.isGM ? <Crown size={20} className="text-pr-secondary" /> : getIcon(member.classBadgeKey)}
                </div>
                
                {/* Name */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "font-bold truncate text-base",
                            isOffline ? "text-pr-text-muted" : "text-pr-text"
                        )} title={member.displayName}>
                            {member.displayName}
                        </span>
                        {member.isGM && (
                           <span className="text-[9px] font-black tracking-tighter uppercase bg-pr-secondary text-pr-bg px-1 rounded-sm">GM</span>
                        )}
                    </div>
                    {isOffline && <span className="text-[10px] text-pr-text-muted/40 uppercase tracking-widest font-bold">Spectral Presence</span>}
                </div>

                {/* Status Pill */}
                <div className={cn(
                    "px-3 py-1 rounded border text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all",
                    statusClasses
                )}>
                    {statusText}
                </div>
            </Panel>
        </motion.div>
    );
}
