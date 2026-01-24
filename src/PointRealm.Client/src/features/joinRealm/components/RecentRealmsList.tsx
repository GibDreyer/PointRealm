import { History, Trash2, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecentRealmItem } from '../../../lib/storage';

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="w-full max-w-2xl mx-auto"
        >
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-sm uppercase tracking-wider font-bold text-[var(--pr-text-muted)] flex items-center gap-2">
                    <History size={16} /> Recently Visited
                </h2>
                <button 
                  onClick={onClearAll}
                  className="text-xs text-[var(--pr-text-muted)] hover:text-[var(--pr-danger)] transition-colors flex items-center gap-1 opacity-70 hover:opacity-100"
                >
                    <Trash2 size={12} /> Clear All
                </button>
            </div>

            <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                    {realms.map((realm) => (
                        <motion.div 
                          key={realm.realmCode}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="group relative flex items-center justify-between p-4 rounded-[var(--pr-radius-lg)] bg-[var(--pr-surface)] border border-[var(--pr-border)] hover:border-[var(--pr-primary)] shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                          onClick={() => onSelect(realm)}
                        >
                             {/* Hover Highlight Line */}
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--pr-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex-1 pl-2">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-mono text-lg font-bold text-[var(--pr-primary)] tracking-wide">
                                        {realm.realmCode}
                                    </span>
                                    {realm.realmName && (
                                        <span className="text-sm font-medium text-[var(--pr-text)] truncate max-w-[200px]">
                                            {realm.realmName}
                                        </span>
                                    )}
                                    {realm.role === 'observer' && (
                                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--pr-surface-elevated)] border border-[var(--pr-border)] text-[var(--pr-text-muted)]">
                                            Observer
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-[var(--pr-text-muted)] flex items-center gap-2">
                                    <span>{timeAgo(realm.lastVisitedAt)}</span>
                                    <span className="opacity-30">•</span>
                                    <span className="flex items-center gap-1">
                                         as <span className="text-[var(--pr-text)] font-medium">{realm.displayNameUsed}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pl-4">
                                <button
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-[var(--pr-primary)] text-[var(--pr-bg)] hover:brightness-110 shadow-sm"
                                  aria-label="Enter Realm"
                                >
                                    <ArrowRight size={16} />
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      onForget(realm.realmCode);
                                  }}
                                  className="group-hover:opacity-100 opacity-0 transition-opacity p-2 text-[var(--pr-text-muted)] hover:text-[var(--pr-danger)] hover:bg-[var(--pr-danger)]/10 rounded-full"
                                  title="Forget this realm"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
