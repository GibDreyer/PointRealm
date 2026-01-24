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
            <div className="flex items-center justify-between mb-6 px-4">
                <h2 className="text-[10px] uppercase tracking-[0.3em] font-black text-pr-primary/60 flex items-center gap-2 italic">
                    <History size={14} className="text-pr-primary/50" /> Past Ventures
                </h2>
                <button 
                  onClick={onClearAll}
                  className="text-[9px] uppercase tracking-[0.2em] text-pr-text-muted/40 hover:text-pr-danger transition-all font-black flex items-center gap-1.5 group"
                >
                    <Trash2 size={10} className="group-hover:rotate-12 transition-transform" /> Wipe Slate
                </button>
            </div>

            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {realms.map((realm) => (
                        <motion.div 
                          key={realm.realmCode}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          whileHover={{ y: -3 }}
                          transition={{ duration: 0.3 }}
                          className="group relative cursor-pointer"
                          onClick={() => onSelect(realm)}
                        >
                            <Panel 
                                variant="subtle" 
                                noPadding 
                                className="border-pr-border/30 bg-pr-surface/40 group-hover:bg-pr-surface/60 group-hover:border-pr-primary/30 group-hover:shadow-[0_0_30px_-10px_rgba(6,182,212,0.2)] transition-all duration-300 overflow-hidden"
                            >
                                {/* Inset Accent Line */}
                                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-transparent via-pr-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 p-5 flex items-center justify-between">
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono text-xl font-black text-pr-primary tracking-tighter shadow-glow-primary/20">
                                                {realm.realmCode}
                                            </span>
                                            {realm.realmName && (
                                                <span className="text-xs font-black text-pr-text/80 tracking-widest uppercase truncate max-w-[160px]">
                                                    {realm.realmName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[9px] text-pr-text-muted/60 flex items-center gap-3 font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5 border-r border-pr-border/30 pr-3 italic">
                                                {timeAgo(realm.lastVisitedAt)}
                                            </span>
                                            <span className="flex items-center gap-1.5 border-r border-pr-border/30 pr-3 italic">
                                                as <span className="text-pr-secondary/80 font-black">{realm.displayNameUsed}</span>
                                            </span>
                                            {realm.role === 'gm' ? (
                                                <span className="text-[8px] font-black text-pr-secondary border border-pr-secondary/30 bg-pr-secondary/5 px-2 py-0.5 rounded leading-none">GM</span>
                                            ) : (
                                                <span className="text-[8px] font-black text-pr-primary/70 border border-pr-primary/30 bg-pr-primary/5 px-2 py-0.5 rounded leading-none uppercase">Party</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              onForget(realm.realmCode);
                                          }}
                                          className="p-2 text-pr-text-muted/40 hover:text-pr-danger hover:bg-pr-danger/10 rounded-lg transition-all"
                                          title="Forget"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="p-2 text-pr-primary/60 group-hover:text-pr-primary group-hover:translate-x-1 transition-all">
                                            <ArrowRight size={18} />
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
