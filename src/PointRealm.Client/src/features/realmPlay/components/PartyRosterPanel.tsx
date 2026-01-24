import { PartyMember } from '../../../types/realm';
import { Crown, WifiOff, MapPin } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Panel } from '../../../components/ui/Panel';
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

    const readyCount = members.filter(m => m.status === 'ready').length;
    
    return (
        <div className="flex flex-col h-full bg-pr-bg/20 backdrop-blur-sm">
            <header className="p-4 border-b border-pr-border/30 sticky top-0 bg-pr-bg/40 z-10">
                <SectionHeader 
                    title="Travelers" 
                    subtitle={`${members.length} in party`} 
                    className="mb-0"
                />
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {/* Vote Status Summary */}
                 {encounterStatus === 'voting' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <Panel variant="subtle" className="text-center p-3 border-pr-primary/20 bg-pr-primary/[0.03]">
                            {hideVoteCounts ? (
                                 <p className="text-[10px] uppercase font-black tracking-widest text-pr-primary animate-pulse">Waiting for Consensus...</p>
                            ) : (
                                 <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-lg font-black text-pr-text">{readyCount}</span>
                                        <span className="text-[10px] uppercase font-black text-pr-text-muted mt-1">/ {members.length} Ready</span>
                                    </div>
                                    <div className="w-full h-1 bg-pr-surface-2 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-pr-primary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(readyCount / members.length) * 100}%` }}
                                        />
                                    </div>
                                 </div>
                            )}
                        </Panel>
                    </motion.div>
                 )}

                 <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {sortedMembers.map(member => {
                            const isSelf = member.id === currentMemberId;
                            const isGM = member.role === 'GM';
                            const isOnline = member.isOnline;
                            
                            return (
                                <motion.div 
                                    key={member.id}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: isOnline ? 1 : 0.5, x: 0 }}
                                    className="group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center border transition-all",
                                                isGM ? "bg-pr-secondary/10 border-pr-secondary/30 text-pr-secondary" : 
                                                isSelf ? "bg-pr-primary/10 border-pr-primary/30 text-pr-primary" : 
                                                "bg-pr-surface-2 border-pr-border/20 text-pr-text-muted"
                                            )}>
                                                <span className="text-xs font-black">{member.name.substring(0, 2).toUpperCase()}</span>
                                            </div>
                                            {isGM && (
                                                <div className="absolute -top-1 -right-1 text-pr-secondary bg-pr-bg rounded-full border border-pr-border/20 p-0.5 shadow-sm">
                                                    <Crown size={10} fill="currentColor" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-bold truncate text-sm transition-colors",
                                                    isSelf ? "text-pr-primary" : isOnline ? "text-pr-text" : "text-pr-text-muted"
                                                )}>
                                                    {member.name}
                                                </span>
                                                {isSelf && <span className="text-[8px] font-black uppercase tracking-tighter text-pr-primary/50">You</span>}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {!isOnline ? (
                                                    <span className="text-[9px] text-pr-danger/50 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                        <WifiOff size={10} /> Lost in Void
                                                    </span>
                                                ) : member.status === 'ready' ? (
                                                    <span className="text-[9px] text-pr-success font-black uppercase tracking-tighter flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-pr-success shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                                                        Ready
                                                    </span>
                                                ) : member.status === 'choosing' ? (
                                                    <span className="text-[9px] text-pr-primary/70 font-bold italic lowercase tracking-tight">Inscribing rune...</span>
                                                ) : (
                                                    <span className="text-[9px] text-pr-text-muted font-bold uppercase tracking-tighter flex items-center gap-1">
                                                        <MapPin size={10} /> Resting
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                 </div>
            </div>
        </div>
    );
}
