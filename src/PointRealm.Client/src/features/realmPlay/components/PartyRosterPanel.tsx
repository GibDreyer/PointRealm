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
        <div className="flex flex-col h-full bg-pr-surface-dim/30 backdrop-blur-md">
            <header className="p-6 border-b border-pr-border/20 sticky top-0 bg-pr-bg/60 backdrop-blur-xl z-20">
                <SectionHeader 
                    title="Party" 
                    subtitle={`${members.length} Souls present`} 
                    className="mb-0 [&_h2]:text-xl"
                />
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                 {/* Vote Status Summary */}
                 {encounterStatus === 'voting' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8"
                    >
                        <Panel variant="subtle" className="text-center p-4 border-pr-primary/10 bg-pr-primary/[0.02] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pr-primary/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                            
                            {hideVoteCounts ? (
                                 <p className="text-[10px] uppercase font-black tracking-[0.3em] text-pr-primary/60 italic">Waiting for Consensus...</p>
                            ) : (
                                 <div className="flex flex-col gap-3 relative z-10">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-2xl font-black text-pr-text tracking-tighter shadow-glow-primary/20">{readyCount}</span>
                                        <span className="text-[10px] uppercase font-black text-pr-text-muted/60 mt-2 tracking-widest italic">/ {members.length} Inscribed</span>
                                    </div>
                                    <div className="w-full h-1 bg-pr-bg rounded-full overflow-hidden border border-pr-border/10">
                                        <motion.div 
                                            className="h-full bg-pr-primary shadow-glow-primary"
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
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: isOnline ? 1 : 0.4, x: 0 }}
                                    className="group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className={cn(
                                                "w-12 h-12 rounded-lg flex items-center justify-center border-2 transition-all duration-300",
                                                isGM ? "bg-pr-secondary/5 border-pr-secondary/40 text-pr-secondary shadow-[0_0_15px_-5px_rgba(251,191,36,0.3)]" : 
                                                isSelf ? "bg-pr-primary/5 border-pr-primary/40 text-pr-primary shadow-[0_0_15px_-5px_rgba(6,182,212,0.3)]" : 
                                                "bg-pr-surface-2/40 border-pr-border/30 text-pr-text-muted/60"
                                            )}>
                                                <span className="text-xs font-black tracking-tighter uppercase">{member.name.substring(0, 2)}</span>
                                            </div>
                                            {isGM && (
                                                <div className="absolute -top-1.5 -right-1.5 text-pr-secondary bg-pr-bg rounded-full border border-pr-secondary/40 p-1 shadow-glow-secondary/20">
                                                    <Crown size={10} fill="currentColor" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-black text-sm transition-colors uppercase tracking-widest truncate",
                                                    isSelf ? "text-pr-primary/80" : isOnline ? "text-pr-text/80" : "text-pr-text-muted/50"
                                                )}>
                                                    {member.name}
                                                </span>
                                                {isSelf && <span className="text-[8px] font-black uppercase tracking-[0.2em] text-pr-primary/40 italic">Self</span>}
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mt-1">
                                                {!isOnline ? (
                                                    <span className="text-[9px] text-pr-danger/40 font-black uppercase tracking-[0.2em] flex items-center gap-1.5 italic">
                                                        <WifiOff size={10} /> Lost in Void
                                                    </span>
                                                ) : member.status === 'ready' ? (
                                                    <span className="text-[9px] text-pr-success/70 font-black uppercase tracking-[0.2em] flex items-center gap-1.5 italic">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-pr-success shadow-glow-success animate-pulse" />
                                                        Ready
                                                    </span>
                                                ) : member.status === 'choosing' ? (
                                                    <span className="text-[9px] text-pr-primary/60 font-black uppercase tracking-[0.3em] flex items-center gap-1.5 animate-pulse italic">
                                                         Inscribing...
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] text-pr-text-muted/40 font-black uppercase tracking-[0.2em] flex items-center gap-1.5 italic">
                                                        <MapPin size={10} className="opacity-40" /> Resting
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
