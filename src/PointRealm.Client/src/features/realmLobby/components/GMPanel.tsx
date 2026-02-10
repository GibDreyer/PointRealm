import { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';
import { Panel } from '../../../components/ui/Panel';
import { Button } from '../../../components/Button';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { QuestManagementDialog } from './QuestManagementDialog';
import { OnboardingStepper } from './OnboardingStepper';
import styles from '../lobby.module.css';
import { cn } from '../../../lib/utils';
import { useRealmStore } from '../../../state/realmStore';
import { useRealmClient } from '@/app/providers/RealtimeProvider';
import { useThemeMode } from '@/theme/ThemeModeProvider';

interface Props {
    activeQuestId: string | undefined;
    quests: { id: string; title: string; }[];
    onManageSettings: () => void;
    gmName: string;
    joinUrl: string;
    partyCount: number;
    questCount: number;
    activeEncounterId?: string;
    className?: string;
}

export function GMPanel({
    activeQuestId,
    quests,
    onManageSettings,
    gmName,
    joinUrl,
    partyCount,
    questCount,
    activeEncounterId,
    className,
}: Props) {
    const [selectedQuestId, setSelectedQuestId] = useState<string>(activeQuestId || "");
    const [isManaging, setIsManaging] = useState(false);
    const realmVersion = useRealmStore((s) => s.realmSnapshot?.realmVersion ?? null);
    const questLog = useRealmStore((s) => s.realmSnapshot?.questLog?.quests ?? []);
    const client = useRealmClient();
    const { mode } = useThemeMode();

    useEffect(() => {
        if (activeQuestId) {
            setSelectedQuestId(activeQuestId);
        } else if (!selectedQuestId && quests && quests.length > 0) {
            const first = quests[0];
            if (first) setSelectedQuestId(first.id);
        }
    }, [activeQuestId, quests, selectedQuestId]);

    const selectedQuest = questLog.find((quest) => quest.id === selectedQuestId);
    const canStartEncounter = Boolean(selectedQuest?.version && realmVersion !== null);

    const handleBeginEncounter = () => {
        if (selectedQuestId) {
            if (!selectedQuest?.version || realmVersion === null) {
                console.warn("Missing realm or quest version for StartEncounter.");
                return;
            }
            client.startEncounter({
                questId: selectedQuestId,
                realmVersion,
                questVersion: selectedQuest.version,
            }).catch(console.error);
        }
    };

    const targetId = selectedQuestId || activeQuestId;

    return (
        <Panel variant="realm" className={cn("relative overflow-hidden", className)}>
            <div className={styles.panelHeader}>
                <SectionHeader 
                    title={mode.labels.facilitator}
                    subtitle={mode.phrases.facilitatorTitle}
                    className="mb-2"
                />
            </div>

            <div className={styles.gmIdentity}>
                <div className={styles.gmBadge}>
                    <Crown size={28} />
                </div>
                <div className={styles.gmName}>{gmName}</div>
                <div className={styles.gmRole}>{mode.phrases.facilitatorTitle}</div>
            </div>

            <OnboardingStepper
                joinUrl={joinUrl}
                partyCount={partyCount}
                questCount={questCount}
                {...(activeEncounterId ? { activeEncounterId } : {})}
                onOpenQuestManager={() => setIsManaging(true)}
                onStartEncounter={handleBeginEncounter}
                canStartEncounter={canStartEncounter}
            />

            <div className={styles.gmActions}>
                {quests.length > 0 && (
                     <div className="mb-2">
                        <label className="text-[10px] font-black text-pr-text-muted uppercase tracking-widest block mb-1">{mode.phrases.activeQuest}</label>
                        <select 
                            value={targetId} 
                            onChange={(e) => setSelectedQuestId(e.target.value)}
                            className="w-full h-10 px-3 rounded-[var(--pr-radius-md)] bg-pr-bg border border-pr-border text-pr-text text-sm focus:border-pr-secondary outline-none transition-colors appearance-none"
                        >
                            <option value="" disabled>{`Choose a ${mode.labels.quest.toLowerCase()}...`}</option>
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
                    {mode.phrases.beginQuest}
                </Button>
                <Button
                    onClick={onManageSettings}
                    variant="ghost"
                    fullWidth
                    className="h-11 py-0 border border-pr-secondary/40 text-pr-secondary hover:text-pr-secondary hover:bg-pr-secondary/10 shadow-none"
                >
                    {`${mode.labels.realm} Settings`}
                </Button>
                <Button
                    onClick={() => setIsManaging(true)}
                    variant="ghost"
                    fullWidth
                    className="h-11 py-0 border border-pr-secondary/40 text-pr-secondary hover:text-pr-secondary hover:bg-pr-secondary/10 shadow-none"
                >
                    {`${mode.labels.quest} Management`}
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
