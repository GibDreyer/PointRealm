import React from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import styles from './OutcomeActions.module.css';
import { cn } from '@/lib/utils';

interface OutcomeActionsProps {
  deckValues: string[];
  isGM: boolean;
  isSealed: boolean;
  sealingValue: string | null;
  onReroll: () => void;
  onSealOutcome: (value: string) => void;
}

const isNumericValue = (value: string) => Number.isFinite(Number(value));

export const OutcomeActions: React.FC<OutcomeActionsProps> = ({
  deckValues,
  isGM,
  isSealed,
  sealingValue,
  onReroll,
  onSealOutcome,
}) => {
  const sealOptions = deckValues.filter(isNumericValue);

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <SectionHeader title="Seal the Outcome" subtitle="Final estimate" className="mb-0" />
        <button
          type="button"
          className={styles.rerollButton}
          onClick={onReroll}
          disabled={isSealed}
        >
          Re-roll the Fates
        </button>
      </div>

      {isGM && (
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
              disabled={isSealed || !!sealingValue}
            >
              {sealingValue === val ? '...' : val}
            </button>
          ))}
          {deckValues.filter(v => !isNumericValue(v)).map((val) => (
            <button
              key={val}
              type="button"
              className={cn(styles.sealChip, styles.disabledChip)}
              disabled
            >
              {val}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
