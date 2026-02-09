import React from 'react';
import styles from './OutcomeActions.module.css';
import { cn } from '@/lib/utils';
import { useThemeMode } from '@/theme/ThemeModeProvider';

interface OutcomeActionsProps {
  deckValues: string[];
  isGM: boolean;
  isSealed: boolean;
  sealingValue: string | null;
  onStartNextQuest: () => void;
  onSealOutcome: (value: string) => void;
  actionsDisabled?: boolean;
}

const isNumericValue = (value: string) => Number.isFinite(Number(value));

export const OutcomeActions: React.FC<OutcomeActionsProps> = ({
  deckValues,
  isGM,
  isSealed,
  sealingValue,
  onStartNextQuest,
  onSealOutcome,
  actionsDisabled = false,
}) => {
  if (!isGM) return null;
  const { mode } = useThemeMode();

  const sealOptions = deckValues.filter(isNumericValue);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.labelGroup}>
          <span className={styles.label}>{mode.phrases.sealOutcome}</span>
          <div className={styles.labelLine} />
        </div>

        <div className={styles.chipRow}>
          {sealOptions.map((val) => (
            <button
              key={val}
              type="button"
              className={cn(
                styles.sealChip,
                sealingValue === val && styles.sealChipActive,
                sealingValue === val && styles.loadingChip
              )}
              onClick={() => onSealOutcome(val)}
              disabled={isSealed || !!sealingValue || actionsDisabled}
            >
              {sealingValue === val ? '...' : val}
            </button>
          ))}
        </div>

        <div className={styles.divider} />

        <button
          type="button"
          className={styles.rerollButton}
          onClick={onStartNextQuest}
          disabled={actionsDisabled} // Allow even if sealed? Yes.
        >
          {`Next ${mode.labels.quest}`}
        </button>
      </div>
    </div>
  );
};
