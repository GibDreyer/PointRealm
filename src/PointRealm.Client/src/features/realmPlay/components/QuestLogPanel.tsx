import { motion, AnimatePresence } from 'framer-motion';
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
        <div className="flex flex-col h-full bg-pr-surface-dim/30 backdrop-blur-md">
            <header className="p-6 border-b border-pr-border/20 flex items-center justify-between sticky top-0 bg-pr-bg/60 backdrop-blur-xl z-20">
                <SectionHeader 
                    title="Quest Log" 
                    subtitle="Chronicles of Journey" 
                    className="mb-0 [&_h2]:text-xl"
                />
                {isGM && (
                    <button 
                        onClick={onAddQuest}
                        className="p-2.5 bg-pr-primary/5 hover:bg-pr-primary/15 rounded-lg text-pr-primary/60 hover:text-pr-primary transition-all border border-pr-primary/10 hover:border-pr-primary/40 group"
                        title="Inscribe New Quest"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                    </button>
                )}
            </header>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {quests.length === 0 ? (
                    <div className="text-center py-20 text-pr-text-muted/40 italic flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-pr-primary/5 rounded-full blur-2xl" />
                            <Scroll size={40} className="relative z-10 opacity-20" />
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.4em] font-black">The chronicles are empty</p>
                        {isGM && (
                            <button 
                                onClick={onAddQuest} 
                                className="text-[10px] text-pr-primary/60 hover:text-pr-primary transition-colors font-black uppercase tracking-[0.2em] border-b border-pr-primary/20 pb-0.5"
                            >
                                Begin Entry
                            </button>
                        )}
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
                                        "relative transition-all duration-300 border-pr-border/20 overflow-hidden",
                                        isActive ? "border-pr-primary/40 shadow-glow-primary/10  z-10" : "hover:border-pr-primary/20",
                                        isSealed && "opacity-60"
                                    )}
                                >
                                    {/* Active Item Indicator */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div 
                                                layoutId="active-quest-indicator"
                                                className="absolute inset-y-0 left-0 w-1 bg-pr-primary shadow-glow-primary"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            />
                                        )}
                                    </AnimatePresence>
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
