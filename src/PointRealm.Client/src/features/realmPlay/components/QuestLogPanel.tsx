import { useState } from 'react';
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
    onOpenSettings?: () => void;
    onReorder?: (newOrder: string[]) => void;
    onEdit?: (quest: Quest) => void;
    onDelete?: (id: string) => void;
}

export function QuestLogPanel({ quests, activeQuestId, isGM, onAddQuest, onSelectQuest, onOpenSettings }: QuestLogPanelProps) {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="flex flex-col h-full">
            <header className="p-5 border-b border-pr-border/20 flex items-center justify-between bg-pr-surface/40">
                <SectionHeader
                    title="Quest Log"
                    subtitle="Issues"
                    className="mb-0 [&_h2]:text-lg"
                />
                {isGM && (
                    <div className="flex items-center gap-2">
                        {isEditing && (
                            <button
                                onClick={onAddQuest}
                                className="p-2 rounded-full border border-pr-border/40 text-pr-text-muted hover:text-pr-text hover:border-pr-primary/40 transition-all"
                                title="Add quest"
                            >
                                <Plus size={16} />
                            </button>
                        )}
                         <button
                            onClick={() => setIsEditing((prev) => !prev)}
                            className="px-3 py-1 rounded-full border border-pr-border/40 text-[10px] uppercase tracking-[0.3em] text-pr-text-muted hover:text-pr-text hover:border-pr-primary/40 transition-all"
                        >
                            {isEditing ? 'Done' : 'Edit'}
                        </button>
                        <button
                            onClick={onOpenSettings}
                            className="p-2 rounded-full border border-pr-border/40 text-pr-text-muted hover:text-pr-text hover:border-pr-primary/40 transition-all"
                            title="Realm Settings"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.72l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                    </div>
                )}
            </header>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {quests.length === 0 ? (
                    <div className="text-center py-16 text-pr-text-muted/50 flex flex-col items-center gap-3">
                        <Scroll size={32} className="opacity-30" />
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold">No active quests</p>
                        {isGM && isEditing && (
                            <button
                                onClick={onAddQuest}
                                className="text-[10px] text-pr-primary/70 hover:text-pr-primary transition-colors font-bold uppercase tracking-[0.2em]"
                            >
                                Add quest
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
                                    variant={isActive ? 'default' : 'realm'}
                                    noPadding
                                    className={cn(
                                        "relative transition-all duration-300 border-pr-border/30 overflow-hidden",
                                        isActive ? "border-pr-primary/40 z-10" : "hover:border-pr-primary/20",
                                        isSealed && "opacity-60"
                                    )}
                                >
                                    {isActive && (
                                        <div className="absolute inset-y-0 left-0 w-1 bg-pr-primary" />
                                    )}
                                        <div className="p-3 flex items-start gap-3">
                                            {/* Status Indicator */}
                                            <div className="mt-1.5 shrink-0">
                                                {isSealed ? (
                                                    <CheckCircle2 size={12} className="text-pr-success" />
                                                ) : (
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        isActive ? "bg-pr-primary" : "bg-pr-text-muted/20"
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

                                            {isGM && !isSealed && isEditing && (
                                                <div className="opacity-60 group-hover:opacity-100 transition-opacity p-1">
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
