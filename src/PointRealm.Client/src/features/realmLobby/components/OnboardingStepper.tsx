import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { Button } from '../../../components/Button';
import { useToast } from '../../../components/ui/ToastSystem';
import { cn } from '../../../lib/utils';
import { useThemeMode } from '@/theme/ThemeModeProvider';
import styles from './OnboardingStepper.module.css';

interface Props {
    joinUrl: string;
    partyCount: number;
    questCount: number;
    activeEncounterId?: string;
    onOpenQuestManager: () => void;
    onStartEncounter: () => void;
    canStartEncounter: boolean;
}

export function OnboardingStepper({
    joinUrl,
    partyCount,
    questCount,
    activeEncounterId,
    onOpenQuestManager,
    onStartEncounter,
    canStartEncounter,
}: Props) {
    const { toast } = useToast();
    const { mode } = useThemeMode();
    const hasRealm = Boolean(joinUrl);
    const hasInvites = partyCount > 1;
    const hasQuest = questCount > 0;
    const hasEncounter = Boolean(activeEncounterId);

    const steps = [
        {
            id: 'realm',
            title: `Create/Join ${mode.labels.realm}`,
            description: `${mode.labels.realm} established and ready.`,
            completed: hasRealm,
        },
        {
            id: 'invite',
            title: `Invite ${mode.labels.party}`,
            description: hasInvites ? `${mode.labels.party} joined.` : `Share the ${mode.labels.realm.toLowerCase()} link with your ${mode.labels.party.toLowerCase()}.`,
            completed: hasInvites,
            actionLabel: 'Copy Invite Link',
            action: async () => {
                try {
                    await navigator.clipboard.writeText(joinUrl);
                    toast('Invite link copied', 'success');
                } catch (err) {
                    console.error('Failed to copy invite link', err);
                    toast('Copy failed', 'error');
                }
            },
        },
        {
            id: 'quest',
            title: `Add First ${mode.labels.quest}`,
            description: hasQuest ? `${mode.labels.quest} log is ready.` : `Create your first ${mode.labels.quest.toLowerCase()} in the log.`,
            completed: hasQuest,
            actionLabel: `Add ${mode.labels.quest}`,
            action: onOpenQuestManager,
        },
        {
            id: 'encounter',
            title: `Start ${mode.labels.encounter}`,
            description: hasEncounter ? `${mode.labels.encounter} in progress.` : `Launch the first ${mode.labels.encounter.toLowerCase()}.`,
            completed: hasEncounter,
            actionLabel: `Start ${mode.labels.encounter}`,
            action: onStartEncounter,
            disabled: !canStartEncounter,
        },
    ];

    const completedCount = steps.filter((step) => step.completed).length;
    const currentIndex = steps.findIndex((step) => !step.completed);
    const activeIndex = currentIndex === -1 ? steps.length - 1 : currentIndex;
    const progress = Math.round((completedCount / steps.length) * 100);

    return (
        <div className={styles.stepper}>
            <div className={styles.header}>
                <span className={styles.title}>Guided Onboarding</span>
                <span className={styles.progressText}>{completedCount}/{steps.length} Complete</span>
            </div>
            <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>

            <div className={styles.steps}>
                {steps.map((step, index) => {
                    const isActive = index === activeIndex && !step.completed;
                    const statusLabel = step.completed ? 'Done' : isActive ? 'Current' : 'Pending';
                    const showAction = isActive && step.action;
                    const indicator = step.completed ? (
                        <CheckCircle2 size={18} />
                    ) : isActive ? (
                        <CircleDot size={18} />
                    ) : (
                        <Circle size={18} />
                    );

                    return (
                        <div
                            key={step.id}
                            className={cn(
                                styles.step,
                                step.completed && styles.stepComplete,
                                isActive && styles.stepActive,
                            )}
                            aria-current={isActive ? 'step' : undefined}
                        >
                            <span
                                className={cn(
                                    styles.indicator,
                                    step.completed && styles.indicatorComplete,
                                    isActive && styles.indicatorActive,
                                )}
                            >
                                {indicator}
                            </span>
                            <div>
                                <div className={styles.stepTitle}>{step.title}</div>
                                <div className={styles.stepDescription}>{step.description}</div>
                                {showAction && (
                                    <div className={styles.stepActions}>
                                        <Button
                                            onClick={step.action}
                                            variant="secondary"
                                            className="h-9 px-3 text-xs uppercase tracking-widest"
                                            disabled={step.disabled}
                                        >
                                            {step.actionLabel}
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className={styles.stepStatus}>{statusLabel}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
