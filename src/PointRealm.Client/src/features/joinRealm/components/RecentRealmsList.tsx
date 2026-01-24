import { History, Trash2, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecentRealmItem } from '../../../lib/storage';
import { Panel } from '../../../components/ui/Panel';


interface RecentRealmsListProps {
    realms: RecentRealmItem[];
    onSelect: (realm: RecentRealmItem) => void;
    onForget: (realmCode: string) => void;
    onClearAll: () => void;
}

function timeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
}

export function RecentRealmsList({ realms, onSelect, onForget, onClearAll }: RecentRealmsListProps) {
    if (realms.length === 0) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg mx-auto"
        >
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xs uppercase tracking-wider font-bold text-pr-text-muted flex items-center gap-2">
                    <History size={14} className="text-pr-primary" /> Recent Realms
                </h2>
                <button 
                  onClick={onClearAll}
                  className="text-[10px] uppercase tracking-tighter text-pr-text-muted hover:text-pr-danger transition-colors flex items-center gap-1 opacity-60 hover:opacity-100"
                >
                    <Trash2 size={10} /> Wipe Slate
                </button>
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {realms.map((realm) => (
                        <motion.div 
                          key={realm.realmCode}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          whileHover={{ y: -2 }}
                          className="group relative cursor-pointer"
                          onClick={() => onSelect(realm)}
                        >
                            <Panel 
                                variant="subtle" 
                                noPadding 
                                className="border-pr-border/40 group-hover:border-pr-primary/40 group-hover:shadow-[0_0_20px_-5px_rgba(6,182,212,0.1)] transition-all overflow-hidden"
                            >
                                {/* Inset Parchment Effect */}
                                <div className="absolute inset-1 rounded-[calc(var(--pr-radius-lg)-4px)] bg-[#1e1e24] opacity-40 z-0 pointer-events-none group-hover:opacity-60 transition-opacity" />
                                
                                <div className="relative z-10 p-4 flex items-center justify-between">
                                    <div className="flex-1 flex flex-col gap-0.5">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-lg font-black text-pr-primary tracking-tighter">
                                                {realm.realmCode}
                                            </span>
                                            {realm.realmName && (
                                                <span className="text-sm font-semibold text-pr-text truncate max-w-[180px]">
                                                    {realm.realmName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-pr-text-muted flex items-center gap-2">
                                            <span className="bg-pr-surface-2 px-1.5 py-0.5 rounded border border-pr-border/30 text-pr-text/70">{timeAgo(realm.lastVisitedAt)}</span>
                                            <span className="flex items-center gap-1">
                                                as <span className="text-pr-secondary font-bold">{realm.displayNameUsed}</span>
                                            </span>
                                            {realm.role === 'observer' && (
                                                <span className="text-[9px] uppercase font-bold text-pr-text-muted border border-pr-border/30 px-1 rounded">Observer</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 bg-pr-bg/30 p-1 rounded-full border border-pr-border/20">
                                        <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              onForget(realm.realmCode);
                                          }}
                                          className="p-1.5 text-pr-text-muted hover:text-pr-danger hover:bg-pr-danger/10 rounded-full transition-colors"
                                          title="Forget"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="w-px h-4 bg-pr-border/20 mx-0.5" />
                                        <div className="p-1.5 text-pr-primary group-hover:translate-x-0.5 transition-transform">
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Panel>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
