import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { hub } from '../../../realtime/hub';
import { Panel } from '../../../components/ui/Panel';
import { Button } from '../../../components/Button';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { QuestManagementDialog } from './QuestManagementDialog';
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
                {quests.length > 0 && (
                     <div className="mb-2">
                        <label className="text-[10px] font-black text-pr-text-muted uppercase tracking-widest block mb-1">Active Quest</label>
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
                    </div>
                )}

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
                    onClick={() => setIsManaging(true)}
                    variant="ghost"
                    fullWidth
                    className="h-11 py-0 border border-pr-secondary/40 text-pr-secondary hover:text-pr-secondary hover:bg-pr-secondary/10 shadow-none"
                >
                    Quest Management
                </Button>
            </div>

            <QuestManagementDialog 
                isOpen={isManaging}
                onClose={() => setIsManaging(false)}
                quests={quests}
                activeQuestId={activeQuestId}
            />
        </Panel>
    );
}
