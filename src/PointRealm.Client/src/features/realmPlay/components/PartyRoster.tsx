import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, User, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartyMember {
  id: string;
  name: string;
  role: "gm" | "player" | "observer";
  presence: "online" | "away" | "disconnected";
  hasVoted: boolean;
  voteValue?: string | null; // Only known if revealed or own vote, but for roster we mainly care if they voted
}

interface PartyRosterProps {
  members: PartyMember[];
  hideVoteCounts?: boolean;
  totalVoters: number;
  votedCount: number;
  className?: string;
}

export const PartyRoster: React.FC<PartyRosterProps> = ({
  members,
  hideVoteCounts = false,
  totalVoters,
  votedCount,
  className
}) => {
  return (
    <div className={cn("flex flex-col gap-4 bg-surface/40 backdrop-blur-sm p-4 rounded-xl border border-border/50", className)}>
      <div className="flex items-center justify-between pb-2 border-b border-border/30">
        <div className="flex items-center gap-2 text-textMuted">
          <Users size={18} />
          <h2 className="text-sm uppercase tracking-widest font-bold">Party</h2>
        </div>
        {!hideVoteCounts && (
          <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
            {votedCount}/{totalVoters} Voted
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false} mode="popLayout">
          {members.map((member) => (
            <MemberCard key={member.id} member={member} hideVoteCounts={hideVoteCounts} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const MemberCard: React.FC<{ member: PartyMember; hideVoteCounts: boolean }> = ({ member, hideVoteCounts }) => {
  const isDisconnected = member.presence === 'disconnected';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: isDisconnected ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-colors",
        "bg-surface border-transparent",
        member.hasVoted && !isDisconnected ? "border-primary/20 bg-primary/5" : ""
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar/Icon Fallback */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center border",
          member.role === 'gm' ? "bg-secondary/10 border-secondary text-secondary" : "bg-primary/10 border-primary/30 text-primary",
          isDisconnected && "grayscale"
        )}>
          {member.role === 'gm' ? <Crown size={14} /> : <User size={14} />}
        </div>

        <div className="flex flex-col">
          <span className={cn("text-sm font-medium", isDisconnected && "text-textMuted line-through opacity-80")}>
            {member.name}
          </span>
          {isDisconnected && (
            <span className="text-[10px] text-danger flex items-center gap-1 uppercase tracking-wide">
              <WifiOff size={10} /> Disconnected
            </span>
          )}
        </div>
      </div>

      {/* Vote Status Indicator */}
      {!isDisconnected && member.role !== 'observer' && (
        <div className="flex items-center">
           {member.hasVoted ? (
             hideVoteCounts ? (
               <span className="text-xs text-primary animate-pulse">Ready</span>
             ) : (
               <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse" />
             )
           ) : (
             <span className="text-xs text-textMuted italic">Thinking...</span>
           )}
        </div>
      )}
    </motion.div>
  );
};
