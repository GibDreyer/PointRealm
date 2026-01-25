import { useState } from 'react';
import { Plus, Info } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { Tooltip } from '../../../components/ui/Tooltip';
import { hub } from '../../../realtime/hub';
import { useRealmStore } from '../../../state/realmStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    quests: { id: string; title: string; }[];
    activeQuestId: string | undefined;
}

export function QuestManagementDialog({ isOpen, onClose, quests, activeQuestId }: Props) {
    const [newQuestTitle, setNewQuestTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const questLogVersion = useRealmStore((s) => s.realmSnapshot?.questLogVersion ?? null);

    // If we have an active quest, select it. otherwise select first.
    // Actually, this dialog manages the LIST and CREATION, but "Begin Encounter" uses the selection in GMPanel?
    // The user said: "The quest management could be better right now it just expands the page when i think it should be a reusable model and we can use on the ream page too. There should also be tool tips here to say what quests are and how to use them."
    // So this dialog should likely allow SELECTING the active quest too?
    // In GMPanel, there was a dropdown to select a quest, then "Begin Quest".
    // Let's assume this dialog allows creating and perhaps setting the "Focus" quest (which might be different from Active).
    // Or maybe just managing the list.
    // The previous GMPanel had a dropdown: `onChange={(e) => setSelectedQuestId(e.target.value)}`.
    // And "Begin Quest" used `selectedQuestId`.
    
    // Ideally, the GM picks a quest here to be the "Active" one for the next encounter.
    // Let's provide a list where you can "Select" a quest.

    const handleCreateQuest = async () => {
        if (!newQuestTitle.trim()) return;
        if (questLogVersion === null) {
            console.warn("Quest log version not available yet.");
            return;
        }
        try {
            await hub.invoke("AddQuest", {
                title: newQuestTitle.trim(),
                description: "",
                questLogVersion,
                commandId: createCommandId(),
            });
            setNewQuestTitle("");
            setIsCreating(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Dialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Quest Log" 
            subtitle="Manage your journey"
        >
            <div className="space-y-6">
                
                <div className="flex items-start gap-3 p-4 bg-pr-primary/5 rounded-xl border border-pr-primary/20 text-sm text-pr-text/90 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-pr-primary/40" />
                    <Info size={18} className="shrink-0 text-pr-primary mt-0.5" />
                    <div className="space-y-1">
                        <p className="font-bold text-xs uppercase tracking-wider text-pr-primary">The Quest Log</p>
                        <p className="text-[11px] leading-relaxed opacity-80">
                            Quests represent your tasks or stories. 
                            <Tooltip content="Each quest becomes a voting round where the party estimates complexity using runes.">
                                 <span className="underline decoration-pr-primary/40 decoration-dashed underline-offset-2 cursor-help mx-0.5">Learn more</span>
                            </Tooltip>
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-pr-text-muted">Available Quests</h3>
                        <Button
                            onClick={() => setIsCreating(true)}
                            disabled={isCreating}
                            variant="ghost"
                            className="h-7 text-[10px] uppercase px-2"
                        >
                            <Plus size={12} className="mr-1" /> New Quest
                        </Button>
                    </div>

                    {isCreating && (
                         <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                             <input 
                                value={newQuestTitle}
                                onChange={(e) => setNewQuestTitle(e.target.value)}
                                placeholder="Quest title..."
                                className="flex-1 h-9 px-3 rounded text-sm bg-pr-bg border border-pr-border focus:border-pr-primary outline-none"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateQuest()}
                             />
                             <Button onClick={handleCreateQuest} variant="primary" className="h-9 px-3 text-xs">Add</Button>
                             <Button onClick={() => setIsCreating(false)} variant="ghost" className="h-9 px-3 text-xs">Cancel</Button>
                         </div>
                    )}

                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {quests.length === 0 ? (
                             <div className="text-center py-8 text-pr-text-muted text-xs italic border border-dashed border-pr-border/30 rounded-lg">
                                 The log is empty.
                             </div>
                        ) : (
                            quests.map(quest => (
                                <div key={quest.id} className="flex items-center justify-between p-3 rounded bg-pr-surface-2 border border-pr-border/10 hover:border-pr-primary/30 transition-colors group">
                                    <span className={cn(
                                        "text-sm font-medium",
                                        activeQuestId === quest.id ? "text-pr-primary" : "text-pr-text"
                                    )}>
                                        {quest.title}
                                    </span>
                                    {/* Actions could go here (Edit/Delete) - keeping simple for now */}
                                    {activeQuestId === quest.id && <span className="text-[10px] uppercase tracking-widest text-pr-primary">Active</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Dialog>
    );
}

function createCommandId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

import { cn } from '../../../lib/utils';
