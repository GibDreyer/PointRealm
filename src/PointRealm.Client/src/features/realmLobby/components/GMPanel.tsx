import { useState, useEffect } from 'react';
import { Play, Settings, Plus } from 'lucide-react';
import { hub } from '../../../realtime/hub';

interface Props {
    activeQuestId: string | undefined;
    quests: { id: string; title: string; }[];
    onManageSettings: () => void;
}

export function GMPanel({ activeQuestId, quests, onManageSettings }: Props) {
    const [selectedQuestId, setSelectedQuestId] = useState<string>(activeQuestId || "");
    const [isCreating, setIsCreating] = useState(false);
    const [newQuestTitle, setNewQuestTitle] = useState("");

    // Sync selected with active if active changes
    useEffect(() => {
        if (activeQuestId) {
            setSelectedQuestId(activeQuestId);
        } else if (!selectedQuestId && quests && quests.length > 0) {
            const first = quests[0];
            if (first) setSelectedQuestId(first.id);
        }
    }, [activeQuestId, quests, selectedQuestId]);

    const handleBeginEncounter = () => {
        if (selectedQuestId) {
            hub.invoke("StartEncounter", selectedQuestId).catch(console.error);
        }
    };

    const handleCreateQuest = async () => {
        if (!newQuestTitle.trim()) return;
        try {
            await hub.invoke("AddQuest", newQuestTitle.trim(), "");
            setNewQuestTitle("");
            setIsCreating(false);
        } catch (err) {
            console.error(err);
        }
    };

    const targetId = selectedQuestId || activeQuestId;

    return (
        <div className="w-full bg-[var(--pr-surface)] border border-[var(--pr-border)] rounded-[var(--pr-radius-xl)] p-5 shadow-[var(--pr-shadow-soft)] mt-4 border-l-4 border-l-[var(--pr-primary)]">
            <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--pr-primary)] mb-0.5">
                    Game Master
                </h3>
                <p className="text-xs text-[var(--pr-text-muted)]">Facilitator Controls</p>
            </div>

            <div className="space-y-4">
                {/* Quest Selection */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--pr-text-muted)] uppercase tracking-wider">Active Quest</label>
                    
                    {quests.length > 0 ? (
                        <select 
                            value={targetId} 
                            onChange={(e) => setSelectedQuestId(e.target.value)}
                            className="w-full p-2 rounded-[var(--pr-radius-md)] bg-[var(--pr-bg)] border border-[var(--pr-border)] text-[var(--pr-text)] text-sm focus:border-[var(--pr-primary)] outline-none"
                        >
                            <option value="" disabled>Select a quest...</option>
                            {quests.map(q => (
                                <option key={q.id} value={q.id}>{q.title}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="text-sm text-[var(--pr-text-muted)] italic p-2 border border-dashed border-[var(--pr-border)] rounded-[var(--pr-radius-md)] bg-[var(--pr-surface-hover)]">
                            No quests available.
                        </div>
                    )}

                    {!isCreating ? (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="text-xs text-[var(--pr-primary)] font-bold hover:underline flex items-center gap-1"
                        >
                            <Plus size={12} /> Create New Quest
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <input 
                                value={newQuestTitle}
                                onChange={(e) => setNewQuestTitle(e.target.value)}
                                placeholder="Quest Title"
                                className="flex-1 p-1.5 text-sm rounded-[var(--pr-radius-sm)] bg-[var(--pr-bg)] border border-[var(--pr-border)]"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateQuest()}
                            />
                            <button 
                                onClick={handleCreateQuest}
                                className="px-2 py-1 bg-[var(--pr-primary)] text-[var(--pr-bg)] rounded-[var(--pr-radius-sm)] text-xs font-bold"
                            >
                                Add
                            </button>
                            <button 
                                onClick={() => setIsCreating(false)}
                                className="px-2 py-1 bg-[var(--pr-surface-hover)] text-[var(--pr-text)] rounded-[var(--pr-radius-sm)] text-xs"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-[var(--pr-border)] space-y-3">
                    <button
                        onClick={handleBeginEncounter}
                        disabled={!targetId}
                        className="w-full py-3 px-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-primary)] text-[var(--pr-bg)] font-bold text-sm shadow-[var(--pr-shadow-soft)] hover:shadow-[var(--pr-shadow-hover)] hover:translate-y-[-1px] active:translate-y-[0px] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        aria-label="Begin Encounter"
                    >
                        <Play size={16} fill="currentColor" />
                        Begin Encounter
                    </button>

                    <button
                        onClick={onManageSettings}
                        className="w-full py-3 px-4 rounded-[var(--pr-radius-md)] bg-[var(--pr-surface-hover)] border border-[var(--pr-border)] text-[var(--pr-text)] font-medium text-sm hover:border-[var(--pr-text-muted)] transition-all flex items-center justify-center gap-2"
                        aria-label="Manage Realm Settings"
                    >
                        <Settings size={16} />
                        Realm Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
