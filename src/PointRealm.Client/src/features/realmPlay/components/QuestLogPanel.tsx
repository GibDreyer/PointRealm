import { useState } from 'react';
import { motion } from 'framer-motion';
import { Quest } from '../../../types/realm';
import { Scroll, Plus, GripVertical, Settings } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Button } from '../../../components/Button';

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
        <div className="flex flex-col h-full" style={{'padding': '.5rem'}}>
            <header className="px-8 pt-16 pb-8 border-b border-pr-border/10 flex items-center justify-between bg-black/40">
                <div className="flex flex-col gap-1">
                    <SectionHeader
                        title="Quest Log"
                        subtitle="Current Ordeals"
                        className="mb-0 [&_h2]:text-[12px] [&_h2]:tracking-[0.5em] [&_h2]:text-pr-secondary-gold"
                    />
                </div>
                {isGM && (
                    <div className="flex items-center gap-2">
                        {isEditing && (
                            <Button
                                onClick={onAddQuest}
                                variant="ghost"
                                className="w-10 h-10 min-h-0 px-0 py-0 border-pr-border/30 hover:border-pr-primary/50"
                                title="Add Quest"
                            >
                                <Plus size={18} />
                            </Button>
                        )}
                         <Button
                            onClick={() => setIsEditing((prev) => !prev)}
                            variant={isEditing ? "primary" : "ghost"}
                            className="h-10 min-h-0 px-5 py-0 text-[11px] font-black !tracking-[0.25em] border-pr-border/30 hover:border-pr-border/60"
                        >
                            {isEditing ? 'Done' : 'Edit'}
                        </Button>
                        <Button
                            onClick={onOpenSettings}
                            variant="ghost"
                            className="w-10 h-10 min-h-0 px-0 py-0 border-pr-border/30 hover:border-pr-secondary/50"
                            title="Realm Settings"
                        >
                           <Settings size={20} />
                        </Button>
                    </div>
                )}
            </header>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 pb-8">
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
                    <div className="flex flex-col gap-5" style={{'padding': '.5rem', 'marginTop': '.125rem', }}>
                        {quests.map((quest) => {
                            const isActive = quest.id === activeQuestId;
                            const isSealed = quest.status === 'Sealed';
                            
                            return (
                                <motion.div
                                    key={quest.id} style={{ 'marginTop': '.75rem', }}
                                    layoutId={`quest-${quest.id}`}
                                    className="group cursor-pointer"
                                    onClick={() => onSelectQuest(quest.id)}
                                >
                                    <div
                                    style={{'padding': '.5rem'}}
                                    className={cn(
                                        "relative transition-all duration-300 border overflow-hidden rounded-lg p-1",
                                        isActive 
                                            ? "border-pr-primary/60 bg-gradient-to-r from-pr-primary/20 to-pr-primary/10 shadow-[0_4px_24px_rgba(0,0,0,0.5),0_0_20px_rgba(74,158,255,0.15)]" 
                                            : "border-pr-border/50 bg-[rgba(15,20,30,0.8)] hover:border-pr-primary/40 hover:bg-[rgba(20,25,35,0.9)] shadow-[0_4px_16px_rgba(0,0,0,0.5)]",
                                        isSealed && "opacity-60"
                                    )}
                                >
                                    <div className="p-5 flex items-start gap-4">
                                        {/* Status Indicator removed or simplified to allow more title room */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className={cn(
                                                    "text-md font-bold truncate transition-colors font-heading tracking-wide",
                                                    isActive ? "text-pr-primary" : "text-white/90",
                                                    isSealed && "text-pr-text-muted"
                                                )}>
                                                    {quest.title}
                                                </h4>
                                                {isActive && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-pr-primary animate-pulse shadow-[0_0_8px_var(--pr-primary-cyan)]" />
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "text-[10px] uppercase font-black tracking-widest px-2 py-0.5 border-l-2",
                                                    isSealed ? "text-pr-text-muted border-pr-text-muted/40" : 
                                                    isActive ? "text-pr-primary border-pr-primary/60" :
                                                    "text-white/40 border-white/10"
                                                )}>
                                                    {quest.status}
                                                </span>
                                                {isSealed && quest.sealedEstimate && (
                                                    <span className="text-[10px] font-bold text-pr-text-muted/60 uppercase tracking-widest">Est: {quest.sealedEstimate}</span>
                                                )}
                                            </div>
                                        </div>

                                        {isGM && !isSealed && isEditing && (
                                            <div className="opacity-40 group-hover:opacity-100 transition-opacity p-1">
                                                <GripVertical size={16} className="text-pr-text-muted/50 cursor-grab" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
