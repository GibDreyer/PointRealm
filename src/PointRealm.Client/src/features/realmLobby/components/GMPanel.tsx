import { useState, useEffect } from 'react';
import { Settings, Plus, Sword } from 'lucide-react';
import { hub } from '../../../realtime/hub';
import { Panel } from '../../../components/ui/Panel';
import { Button } from '../../../components/Button';
import { SectionHeader } from '../../../components/ui/SectionHeader';

interface Props {
    activeQuestId: string | undefined;
    quests: { id: string; title: string; }[];
    onManageSettings: () => void;
}

export function GMPanel({ activeQuestId, quests, onManageSettings }: Props) {
    const [selectedQuestId, setSelectedQuestId] = useState<string>(activeQuestId || "");
    const [isCreating, setIsCreating] = useState(false);
    const [newQuestTitle, setNewQuestTitle] = useState("");

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
        <Panel className="border-l-4 border-l-pr-primary relative overflow-hidden">
            {/* Subtle GM texture or glow */}
            <div className="absolute inset-0 bg-pr-primary/[0.02] pointer-events-none" />

            <div className="flex justify-between items-start mb-4">
                <SectionHeader 
                    title="Game Master" 
                    subtitle="Facilitator Controls" 
                    className="mb-0"
                />
                <button 
                    onClick={onManageSettings}
                    className="p-2 rounded-full border border-pr-border/30 text-pr-text-muted hover:text-pr-primary hover:border-pr-primary transition-all bg-pr-surface-2"
                    title="Realm Settings"
                >
                    <Settings size={18} />
                </button>
            </div>

            <div className="space-y-4 relative z-10">
                {/* Quest Selection */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-pr-text-muted uppercase tracking-widest block mb-1">Active Quest</label>
                    
                    {quests.length > 0 ? (
                        <select 
                            value={targetId} 
                            onChange={(e) => setSelectedQuestId(e.target.value)}
                            className="w-full p-2.5 rounded-[var(--pr-radius-md)] bg-pr-bg border border-pr-border text-pr-text text-sm focus:border-pr-primary outline-none transition-colors appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                        >
                            <option value="" disabled>Choose a journey...</option>
                            {quests.map(q => (
                                <option key={q.id} value={q.id}>{q.title}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="text-xs text-pr-text-muted italic p-3 border border-dashed border-pr-border/40 rounded-[var(--pr-radius-md)] bg-pr-bg/50">
                            The log is empty. No quests found.
                        </div>
                    )}

                    {!isCreating ? (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="text-[10px] text-pr-primary font-black uppercase tracking-wider hover:text-pr-primary-hover flex items-center gap-1 transition-colors"
                        >
                            <Plus size={12} strokeWidth={3} /> Ink New Quest
                        </button>
                    ) : (
                        <div className="flex flex-col gap-2 p-2 rounded-lg bg-pr-bg/40 border border-pr-border/20">
                            <input 
                                value={newQuestTitle}
                                onChange={(e) => setNewQuestTitle(e.target.value)}
                                placeholder="E.g. The Spooky Crypt"
                                className="w-full p-2 text-sm rounded-[var(--pr-radius-sm)] bg-pr-bg border border-pr-border text-pr-text focus:border-pr-primary outline-none"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateQuest()}
                            />
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleCreateQuest}
                                    variant="primary"
                                    className="h-8 py-0 px-3 text-[10px]"
                                >
                                    Add Quest
                                </Button>
                                <Button 
                                    onClick={() => setIsCreating(false)}
                                    variant="secondary"
                                    className="h-8 py-0 px-3 text-[10px]"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-pr-border/30 mt-2">
                    <Button
                        onClick={handleBeginEncounter}
                        disabled={!targetId}
                        variant="primary"
                        fullWidth
                        className="py-6 text-base"
                    >
                        <Sword size={18} className="mr-2" />
                        Initiate Encounter
                    </Button>
                </div>
            </div>
        </Panel>
    );
}
