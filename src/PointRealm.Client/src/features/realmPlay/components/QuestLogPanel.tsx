import { motion } from 'framer-motion';
import { Quest } from '../../../types/realm';
import { Scroll, Plus, GripVertical, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Panel } from '../../../components/ui/Panel';
import { SectionHeader } from '../../../components/ui/SectionHeader';

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
        <div className="flex flex-col h-full bg-pr-bg/20 backdrop-blur-sm">
            <header className="p-4 border-b border-pr-border/30 flex items-center justify-between sticky top-0 bg-pr-bg/40 z-10">
                <SectionHeader 
                    title="Quest Log" 
                    subtitle="Chronicles of Journey" 
                    className="mb-0"
                />
                {isGM && (
                    <button 
                        onClick={onAddQuest}
                        className="p-2 hover:bg-pr-surface-2 rounded-full text-pr-text-muted hover:text-pr-primary transition-all border border-transparent hover:border-pr-primary/30"
                        title="Inscribe New Quest"
                    >
                        <Plus size={18} />
                    </button>
                )}
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {quests.length === 0 ? (
                    <div className="text-center py-12 text-pr-text-muted/50 italic flex flex-col items-center gap-3">
                        <Scroll size={32} className="opacity-10" />
                        <p className="text-xs uppercase tracking-widest font-bold">The chronicles are empty</p>
                        {isGM && <button onClick={onAddQuest} className="text-[10px] text-pr-primary hover:underline font-black uppercase tracking-tighter">New Entry</button>}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {quests.map((quest) => {
                            const isActive = quest.id === activeQuestId;
                            const isSealed = quest.status === 'Sealed';
                            
                            return (
                                <motion.div
                                    key={quest.id}
                                    layoutId={`quest-${quest.id}`}
                                    className="group cursor-pointer"
                                    onClick={() => onSelectQuest(quest.id)}
                                >
                                    <Panel
                                        variant={isActive ? 'default' : 'subtle'}
                                        noPadding
                                        className={cn(
                                            "relative transition-all duration-300",
                                            isActive ? "border-pr-primary/40 shadow-[0_0_20px_-5px_rgba(6,182,212,0.15)] ring-1 ring-pr-primary/20" : "border-pr-border/20 hover:border-pr-border/40",
                                            isSealed && "opacity-80 grayscale-[30%]"
                                        )}
                                    >
                                        <div className="p-3 flex items-start gap-3">
                                            {/* Status Indicator */}
                                            <div className="mt-1.5 shrink-0">
                                                {isSealed ? (
                                                    <CheckCircle2 size={12} className="text-pr-success" />
                                                ) : (
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        isActive ? "bg-pr-primary shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" : "bg-pr-text-muted/20"
                                                    )} />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className={cn(
                                                    "text-sm font-bold truncate transition-colors",
                                                    isActive ? "text-pr-primary" : "text-pr-text",
                                                    isSealed && "text-pr-text-muted"
                                                )}>
                                                    {quest.title}
                                                </h3>
                                                
                                                <div className="mt-0.5 flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-[9px] uppercase font-black tracking-tighter px-1 rounded border",
                                                        isSealed ? "bg-pr-surface-2 text-pr-text-muted border-pr-border/20" : 
                                                        isActive ? "bg-pr-primary/10 text-pr-primary border-pr-primary/20" :
                                                        "bg-pr-bg text-pr-text-muted border-pr-border/10"
                                                    )}>
                                                        {quest.status}
                                                    </span>
                                                    {isSealed && quest.sealedEstimate && (
                                                        <span className="text-[9px] font-bold text-pr-text-muted/60 uppercase">Est: {quest.sealedEstimate}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {isGM && !isSealed && (
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                    <GripVertical size={14} className="text-pr-text-muted/30 cursor-grab" />
                                                </div>
                                            )}
                                        </div>
                                    </Panel>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
