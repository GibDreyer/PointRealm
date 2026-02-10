import { useMemo } from 'react';
import { Reorder } from 'framer-motion';
import { GripVertical } from 'lucide-react';

import { Panel } from '@/components/ui/Panel';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useRealmClient } from '@/app/providers/RealtimeProvider';
import type { LobbyQuest, LobbyQuestStatus } from '../types';
import styles from '../lobby.module.css';

interface QuestListProps {
    quests: LobbyQuest[];
    questLogVersion: number;
    canReorder: boolean;
    isConnected: boolean;
}

const STATUS_COLUMNS: LobbyQuestStatus[] = ['Ready', 'Estimating', 'Estimated'];

export function QuestList({ quests, questLogVersion, canReorder, isConnected }: QuestListProps) {
    const client = useRealmClient();

    const sortedQuests = useMemo(
        () => [...quests].sort((a, b) => a.orderIndex - b.orderIndex),
        [quests]
    );

    const grouped = useMemo(() => {
        const byStatus: Record<LobbyQuestStatus, LobbyQuest[]> = {
            Ready: [],
            Estimating: [],
            Estimated: []
        };

        for (const quest of sortedQuests) {
            byStatus[quest.status].push(quest);
        }

        return byStatus;
    }, [sortedQuests]);

    const handleReorder = async (newOrder: LobbyQuest[]) => {
        if (!canReorder) return;

        try {
            await client.reorderQuests({
                newOrder: newOrder.map((quest) => quest.id),
                questLogVersion
            });
        } catch (error) {
            console.error('Failed to reorder quests.', error);
        }
    };

    return (
        <Panel variant="realm" className={`${styles.panel} ${styles.panelQuest}`}>
            <div className={styles.panelHeader}>
                <SectionHeader
                    title="Quest Board"
                    subtitle="Story status updates from snapshot state"
                    className="mb-0"
                />
            </div>

            <div className={styles.questStatusGrid}>
                {STATUS_COLUMNS.map((status) => (
                    <div key={status} className={styles.questStatusColumn}>
                        <p className={styles.questStatusLabel}>{status}</p>
                        <div className={styles.questStatusCards}>
                            {grouped[status].length === 0 ? (
                                <p className={styles.questEmpty}>No quests</p>
                            ) : (
                                grouped[status].map((quest) => (
                                    <div key={quest.id} className={styles.questStatusCard}>
                                        {quest.title}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.questReorderSection}>
                <p className={styles.questReorderLabel}>Backlog order</p>
                <Reorder.Group
                    axis="y"
                    values={sortedQuests}
                    onReorder={canReorder ? handleReorder : () => undefined}
                    className={styles.questReorderList}
                >
                    {sortedQuests.map((quest) => (
                        <Reorder.Item
                            key={quest.id}
                            value={quest}
                            dragListener={canReorder && isConnected}
                            className={styles.questReorderItem}
                        >
                            <div className={styles.questReorderItemBody}>
                                <GripVertical size={14} className={styles.questDragHandle} />
                                <span className={styles.questReorderTitle}>{quest.title}</span>
                                <span className={styles.questBadge}>{quest.status}</span>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </div>
        </Panel>
    );
}
