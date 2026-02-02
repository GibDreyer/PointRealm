
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { PartyMember } from '../../../types/realm';
import { Check, WifiOff, Crown, Eye } from 'lucide-react';
import runeBackground from '@/assets/rune-background.png';



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
    
    const isGM = member.role === 'GM';
    const isObserver = member.role === 'Observer';

    
    return (
        <div className={cn(
            "flex flex-col items-center gap-1",
            position === 'left' && "items-end",
            position === 'right' && "items-start",
            className
        )}>
            {/* Podium/Seat Backdrop - wraps entire player element */}
            <div className={cn(
                "relative flex flex-col items-center p-2 sm:p-3 rounded-xl transition-all duration-500",
                "bg-gradient-to-b from-pr-surface/60 to-pr-surface/30",
                "border border-pr-primary/10 backdrop-blur-sm shadow-xl",
                hasVoted && "border-pr-primary/30 bg-gradient-to-b from-pr-surface/70 to-pr-primary/5",
                isDisconnected && "opacity-60"
            )}>
                {/* Subtle inner glow when voted */}
                {hasVoted && !isRevealed && (
                    <div className="absolute inset-0 rounded-xl bg-pr-primary/5 animate-pulse pointer-events-none" />
                )}

                {/* The Vote Card */}
                <div className="h-16 w-12 sm:h-20 sm:w-14 relative flex items-center justify-center mb-2">
                    <AnimatePresence mode="wait">
                        {hasVoted ? (
                            <motion.div
                                key={isRevealed ? 'revealed' : 'hidden'}
                                initial={{ rotateY: 90, scale: 0.8, opacity: 0 }}
                                animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                                exit={{ rotateY: -90, scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className={cn(
                                    "absolute inset-0 rounded-lg shadow-lg overflow-hidden",
                                    "border",
                                    isRevealed
                                        ? "border-pr-primary/50 bg-pr-surface"
                                        : "border-pr-primary/20"
                                )}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {isRevealed ? (
                                    /* Revealed card face */
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-pr-surface-elevated to-pr-surface relative">
                                        {/* Ornate frame texture (subtle) */}
                                        <div 
                                            className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none bg-cover bg-center"
                                            style={{ backgroundImage: `url(${runeBackground})` }}
                                        />
                                        {/* Value */}
                                        <span className="relative z-10 font-heading font-black text-xl sm:text-2xl text-pr-primary drop-shadow-[0_0_8px_rgba(74,158,255,0.5)]">
                                            {vote || "?"}
                                        </span>
                                        {/* Glow effect */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-pr-primary/10 to-transparent pointer-events-none" />
                                    </div>
                                ) : (
                                    /* Face-down card with rune texture */
                                    <div className="w-full h-full relative">
                                        {/* Rune background texture */}
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center opacity-70"
                                            style={{ backgroundImage: `url(${runeBackground})` }}
                                        />
                                        {/* Overlay gradient for depth */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-pr-primary/20 via-transparent to-pr-primary/10" />
                                        {/* Subtle center emblem */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6 opacity-30 rounded-full border-2 border-pr-primary/50 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-pr-primary/50" />
                                            </div>
                                        </div>
                                        {/* Shimmer animation */}
                                        <motion.div 
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '200%' }}
                                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            /* Empty slot - waiting for vote */
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 rounded-lg border-2 border-dashed border-pr-primary/20 bg-pr-surface/20 flex items-center justify-center"
                            >
                                <div className="w-4 h-4 rounded-full border border-pr-primary/30 animate-pulse" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Waiting text */}
                {!hasVoted && !isRevealed && !isObserver && (
                    <div className="text-[8px] sm:text-[10px] text-pr-primary/40 animate-pulse font-medium tracking-wide">
                        Waiting...
                    </div>
                )}

                {/* Avatar & Name */}
                <div className={cn(
                    "flex items-center gap-2",
                    position === 'left' && "flex-row-reverse",
                )}>
                    <div className="relative">
                        <div className={cn(
                            "w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 overflow-hidden flex items-center justify-center transition-all duration-500",
                            "bg-pr-surface-elevated",
                            hasVoted 
                                ? "border-pr-primary shadow-[0_0_12px_rgba(74,158,255,0.4)]" 
                                : "border-pr-primary/20",
                            isDisconnected && "grayscale"
                        )}>
                            {avatarImageUrl ? (
                                <img
                                    src={avatarImageUrl}
                                    alt={`${member.name} avatar`}
                                    className="h-full w-full rounded-full object-cover"
                                />
                            ) : avatarEmoji ? (
                                <span className="text-sm sm:text-base" aria-label={`${member.name} avatar`}>
                                    {avatarEmoji}
                                </span>
                            ) : (
                                <span className="text-[10px] sm:text-xs font-bold text-pr-text-muted">
                                    {member.name.slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                         
                        {/* Status Indicators */}
                        <AnimatePresence>
                            {hasVoted && !isRevealed && (
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-pr-primary rounded-full flex items-center justify-center text-pr-bg shadow-lg"
                                >
                                    <Check size={10} strokeWidth={4} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {isDisconnected && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                <WifiOff size={10} />
                            </div>
                        )}
                    </div>

                    <div className={cn(
                        "flex flex-col text-[10px] sm:text-xs",
                        position === 'left' && "text-right",
                        position === 'right' && "text-left",
                        (position === 'top' || position === 'bottom') && "text-center"
                    )}>
                        <span className={cn(
                            "font-semibold max-w-[60px] sm:max-w-[80px] truncate leading-tight transition-colors duration-300",
                            hasVoted ? "text-pr-text" : "text-pr-text-muted"
                        )}>
                            {member.name}
                        </span>
                        {isGM && (
                            <div className="flex items-center gap-0.5 text-pr-primary/80">
                                <Crown size={9} strokeWidth={2.5} />
                                <span className="text-[8px] uppercase tracking-wider font-bold">GM</span>
                            </div>
                        )}
                        {isObserver && (
                            <div className="flex items-center gap-0.5 text-pr-text-muted">
                                <Eye size={9} strokeWidth={2.5} />
                                <span className="text-[8px] uppercase tracking-wider">Spectator</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
