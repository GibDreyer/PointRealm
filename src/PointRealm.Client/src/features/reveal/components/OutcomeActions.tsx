import React from 'react';
import { Button } from '@/components/Button';
import { RuneChip } from '@/components/ui/RuneChip';
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
        <Button
          variant="ghost"
          className={styles.rerollButton}
          onClick={onReroll}
          disabled={isSealed}
        >
          Re-roll the Fates
        </Button>
      </div>

      {isGM && (
        <div className={styles.chipRow}>
          {sealOptions.map((val) => (
            <RuneChip
              key={val}
              type="button"
              active={sealingValue === val}
              onClick={() => onSealOutcome(val)}
              disabled={isSealed || !!sealingValue}
              className={cn(sealingValue === val && styles.loadingChip)}
            >
              {sealingValue === val ? 'Sealing…' : val}
            </RuneChip>
          ))}
          {deckValues.filter(v => !isNumericValue(v)).map((val) => (
            <RuneChip
              key={val}
              type="button"
              active={false}
              disabled
              className={styles.disabledChip}
            >
              {val}
            </RuneChip>
          ))}
        </div>
      )}
    </div>
  );
};
