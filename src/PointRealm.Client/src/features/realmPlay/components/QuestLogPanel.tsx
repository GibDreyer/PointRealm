import { useState } from 'react';
import { Quest } from '../../../types/realm';
import { Scroll, Plus, Settings } from 'lucide-react';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Button } from '../../../components/Button';
import { QuestListItem } from './QuestListItem';

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

export function QuestLogPanel({ 
    quests, 
    activeQuestId, 
    isGM, 
    onAddQuest, 
    onSelectQuest, 
    onOpenSettings 
}: QuestLogPanelProps) {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="flex flex-col h-full" style={{ padding: '.5rem' }}>
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
                        <div className="flex flex-col gap-5" style={{ padding: '.5rem', marginTop: '.125rem' }}>
                            {quests.map((quest) => (
                                <QuestListItem
                                    key={quest.id}
                                    quest={quest}
                                    isActive={quest.id === activeQuestId}
                                    isEditing={isEditing}
                                    isGM={isGM}
                                    onClick={() => onSelectQuest(quest.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
