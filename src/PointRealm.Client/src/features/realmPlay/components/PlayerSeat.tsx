
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { PartyMember } from '../../../types/realm';
import { Check, WifiOff, Crown, Eye } from 'lucide-react';



interface PlayerSeatProps {
    member: PartyMember;
    vote?: string | null;
    isRevealed: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}

export function PlayerSeat({ member, vote, isRevealed, position, className }: PlayerSeatProps) {
    const hasVoted = member.status === 'ready';
    const isDisconnected = !member.isOnline || member.status === 'disconnected';
    const avatarImageUrl = member.profileImageUrl?.trim();
    const avatarEmoji = member.avatarEmoji?.trim() ?? member.profileEmoji?.trim();
    
    // Determine card state
    // If revealed, show the vote value (or ? if they didn't vote but were ready?? usually ready means voted)
    // If not revealed, but voted, show "face down" card
    // If not voted, show nothing or empty slot
    const isGM = member.role === 'GM';
    const isObserver = member.role === 'Observer';

    
    return (
        <div className={cn(
            "flex flex-col items-center gap-2",
            position === 'left' && "items-end",
            position === 'right' && "items-start",
            className
        )}>
            {/* The Card Element */}
            <div className="h-16 w-12 sm:h-20 sm:w-14 relative flex items-center justify-center">
                {hasVoted ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn(
                            "absolute inset-0 rounded-lg shadow-sm border",
                            isRevealed
                                ? "bg-pr-surface border-pr-primary/50 text-pr-primary font-serif font-bold text-xl flex items-center justify-center"
                                : "bg-pr-primary border-pr-primary/20 bg-[url('/patterns/subtle-noise.png')]"
                        )}
                    >
                         {isRevealed ? (vote || "?") : (
                             <div className="w-full h-full opacity-20 flex items-center justify-center">
                                 <div className="w-4 h-4 rounded-full border-2 border-pr-bg" />
                             </div>
                         )}
                    </motion.div>
                ) : (
                    <div className="absolute inset-0 rounded-lg border border-dashed border-pr-border/30 bg-white/5 flex items-center justify-center">
                        <span className="sr-only">Waiting...</span>
                    </div>
                )}
            </div>

            {!hasVoted && !isRevealed && !isObserver && (
                 <div className="text-[10px] text-pr-text-muted/60 animate-pulse font-medium tracking-wide">
                     Waiting for vote...
                 </div>
            )}


            {/* Avatar & Name */}
            <div className={cn(
                "flex items-center gap-2",
                position === 'left' && "flex-row-reverse",
            )}>
                <div className="relative">
                     <div className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-pr-border/50 bg-pr-surface overflow-hidden flex items-center justify-center text-pr-text-muted",
                        hasVoted && "border-pr-primary text-pr-primary shadow-[0_0_10px_rgba(var(--pr-primary-rgb),0.3)]",
                        isDisconnected && "opacity-50 grayscale"
                     )}>
                        {avatarImageUrl ? (
                            <img
                                src={avatarImageUrl}
                                alt={`${member.name} avatar`}
                                className="h-full w-full rounded-full object-cover"
                            />
                        ) : avatarEmoji ? (
                            <span className="text-base sm:text-lg" aria-label={`${member.name} avatar`}>
                                {avatarEmoji}
                            </span>
                        ) : (
                            <span className="text-xs sm:text-sm font-medium">
                                {member.name.slice(0, 2).toUpperCase()}
                            </span>
                        )}
                     </div>
                     
                     {/* Status Indicators */}
                     {hasVoted && !isRevealed && (
                         <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pr-primary rounded-full flex items-center justify-center text-pr-bg text-[10px]">
                             <Check size={10} strokeWidth={4} />
                         </div>
                     )}
                     {isDisconnected && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white">
                             <WifiOff size={10} />
                         </div>
                     )}
                </div>

                <div className={cn(
                    "flex flex-col text-xs",
                    position === 'left' && "text-right",
                    position === 'right' && "text-left",
                    (position === 'top' || position === 'bottom') && "text-center"
                )}>
                    <span className="font-medium text-pr-text/90 max-w-[80px] truncate leading-tight">
                        {member.name}
                    </span>
                    {isGM && (
                        <div className="flex items-center gap-1 text-pr-primary/80">
                            <Crown size={10} strokeWidth={2.5} />
                            <span className="text-[9px] uppercase tracking-wider">GM</span>
                        </div>
                    )}
                    {isObserver && (
                         <div className="flex items-center gap-1 text-pr-text-muted">
                            <Eye size={10} strokeWidth={2.5} />
                            <span className="text-[9px] uppercase tracking-wider">Spectator</span>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
