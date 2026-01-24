import { motion } from 'framer-motion';
import { Quest } from '../../../types/realm';
import { Scroll, Plus, GripVertical } from 'lucide-react';
import { cn } from '../../../lib/utils'; 

interface QuestLogPanelProps {
    quests: Quest[];
    activeQuestId: string | undefined;
    isGM: boolean;
    onAddQuest: () => void;
    onSelectQuest: (id: string) => void; 
    onReorder?: (newOrder: string[]) => void;
    onEdit?: (quest: Quest) => void;
    onDelete?: (id: string) => void;
}

export function QuestLogPanel({ quests, activeQuestId, isGM, onAddQuest, onSelectQuest }: QuestLogPanelProps) {
    return (
        <div className="flex flex-col h-full bg-[var(--pr-surface-dim)]/50 backdrop-blur-md border-r border-[var(--pr-border)]">
            <header className="p-4 border-b border-[var(--pr-border)] flex items-center justify-between sticky top-0 bg-[var(--pr-surface-dim)] z-10">
                <div className="flex items-center gap-2 text-[var(--pr-primary)]">
                    <Scroll className="w-5 h-5" />
                    <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--pr-heading-font)' }}>Quest Log</h2>
                </div>
                {isGM && (
                    <button 
                        onClick={onAddQuest}
                        className="p-1.5 hover:bg-[var(--pr-surface-hover)] rounded-md text-[var(--pr-text-muted)] hover:text-[var(--pr-text)] transition-colors"
                        aria-label="Add Quest"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {quests.length === 0 ? (
                    <div className="text-center py-8 text-[var(--pr-text-muted)] italic">
                        The Quest Log is empty.
                        {isGM && <div className="mt-2"><button onClick={onAddQuest} className="text-[var(--pr-primary)] hover:underline">Add a Quest</button></div>}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {quests.map((quest) => {
                            const isActive = quest.id === activeQuestId;
                            return (
                                <motion.div
                                    key={quest.id}
                                    layoutId={`quest-${quest.id}`}
                                    className={cn(
                                        "group relative p-3 rounded-lg border transition-all cursor-pointer",
                                        isActive 
                                            ? "bg-[var(--pr-surface-active)] border-[var(--pr-primary-dim)] shadow-[0_0_15px_-3px_var(--pr-primary-glow)]" 
                                            : "bg-[var(--pr-surface)] border-[var(--pr-border)] hover:border-[var(--pr-border-hover)]"
                                    )}
                                    onClick={() => onSelectQuest(quest.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "mt-1 w-2 h-2 rounded-full",
                                            isActive ? "bg-[var(--pr-primary)] shadow-[0_0_8px_var(--pr-primary)] animate-pulse" : "bg-[var(--pr-text-muted)] opacity-50"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className={cn(
                                                "font-medium truncate",
                                                isActive ? "text-[var(--pr-primary)]" : "text-[var(--pr-text)]"
                                            )}>
                                                {quest.title}
                                            </h3>
                                            {quest.status === 'Sealed' && (
                                                <div className="mt-1 flex items-center gap-2 text-xs text-[var(--pr-text-muted)]">
                                                    <span className="px-1.5 py-0.5 rounded bg-black/20 border border-[var(--pr-border)]">Sealed</span>
                                                    {quest.sealedEstimate && <span>Est: {quest.sealedEstimate}</span>}
                                                </div>
                                            )}
                                        </div>
                                        {isGM && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <GripVertical className="w-4 h-4 text-[var(--pr-text-muted)] cursor-grab" />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
