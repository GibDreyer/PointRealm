import { useState, useEffect } from 'react';
import { Crown, Plus } from 'lucide-react';
import { hub } from '../../../realtime/hub';
import { Panel } from '../../../components/ui/Panel';
import { Button } from '../../../components/Button';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import styles from '../lobby.module.css';
import { cn } from '../../../lib/utils';

interface Props {
    activeQuestId: string | undefined;
    quests: { id: string; title: string; }[];
    onManageSettings: () => void;
    gmName: string;
    className?: string;
}

export function GMPanel({ activeQuestId, quests, onManageSettings, gmName, className }: Props) {
    const [selectedQuestId, setSelectedQuestId] = useState<string>(activeQuestId || "");
    const [isCreating, setIsCreating] = useState(false);
    const [newQuestTitle, setNewQuestTitle] = useState("");
    const [isManaging, setIsManaging] = useState(false);

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
        <Panel variant="realm" className={cn("relative overflow-hidden", className)}>
            <div className={styles.panelHeader}>
                <SectionHeader 
                    title="Game Master" 
                    subtitle="Facilitator" 
                    className="mb-0"
                />
            </div>

            <div className={styles.gmIdentity}>
                <div className={styles.gmBadge}>
                    <Crown size={28} />
                </div>
                <div className={styles.gmName}>{gmName}</div>
                <div className={styles.gmRole}>Facilitator</div>
            </div>

            <div className={styles.gmActions}>
                <Button
                    onClick={handleBeginEncounter}
                    disabled={!targetId}
                    variant="secondary"
                    fullWidth
                    className="h-11 py-0 shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    Begin Quest
                </Button>
                <Button
                    onClick={onManageSettings}
                    variant="ghost"
                    fullWidth
                    className="h-11 py-0 border border-pr-secondary/40 text-pr-secondary hover:text-pr-secondary hover:bg-pr-secondary/10 shadow-none"
                >
                    Realm Settings
                </Button>
                <Button
                    onClick={() => setIsManaging((prev) => !prev)}
                    variant="ghost"
                    fullWidth
                    className="h-11 py-0 border border-pr-secondary/40 text-pr-secondary hover:text-pr-secondary hover:bg-pr-secondary/10 shadow-none"
                >
                    Quest Management
                </Button>
            </div>

            {isManaging && (
                <div className={styles.gmManage}>
                    <label className="text-[10px] font-black text-pr-text-muted uppercase tracking-widest block">Active Quest</label>
                    
                    {quests.length > 0 ? (
                        <select 
                            value={targetId} 
                            onChange={(e) => setSelectedQuestId(e.target.value)}
                            className="w-full h-10 px-3 rounded-[var(--pr-radius-md)] bg-pr-bg border border-pr-border text-pr-text text-sm focus:border-pr-secondary outline-none transition-colors appearance-none"
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
                            className="text-[10px] text-pr-secondary font-black uppercase tracking-wider hover:text-pr-secondary flex items-center gap-1 transition-colors"
                        >
                            <Plus size={12} strokeWidth={3} /> Ink New Quest
                        </button>
                    ) : (
                        <div className="flex flex-col gap-2 p-2 rounded-lg bg-pr-bg/40 border border-pr-border/20">
                            <input 
                                value={newQuestTitle}
                                onChange={(e) => setNewQuestTitle(e.target.value)}
                                placeholder="E.g. The Spooky Crypt"
                                className="w-full p-2 text-sm rounded-[var(--pr-radius-sm)] bg-pr-bg border border-pr-border text-pr-text focus:border-pr-secondary outline-none"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateQuest()}
                            />
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleCreateQuest}
                                    variant="secondary"
                                    className="h-8 py-0 px-3 text-[10px] shadow-none"
                                >
                                    Add Quest
                                </Button>
                                <Button 
                                    onClick={() => setIsCreating(false)}
                                    variant="ghost"
                                    className="h-8 py-0 px-3 text-[10px] border border-pr-secondary/40 text-pr-secondary hover:text-pr-secondary hover:bg-pr-secondary/10 shadow-none"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Panel>
    );
}
