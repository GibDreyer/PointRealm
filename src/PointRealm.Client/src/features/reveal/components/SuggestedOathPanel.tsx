import React from 'react';
import { Panel } from '@/components/ui/Panel';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { RuneChip } from '@/components/ui/RuneChip';
import styles from './SuggestedOathPanel.module.css';

interface SuggestedOathPanelProps {
  suggestion: { kind: 'median' | 'mode'; value: string } | null;
  className?: string;
}

export const SuggestedOathPanel: React.FC<SuggestedOathPanelProps> = ({
  suggestion,
  className
}) => {
  if (!suggestion) return null;

  return (
    <Panel className={className}>
      <div className={styles.panel}>
        <SectionHeader title="Suggested Oath" subtitle="Median/Mode suggestion" className="mb-0" />
        <div className={styles.chipWrap}>
          <RuneChip type="button" active className={styles.glow}>
            {suggestion.value}
          </RuneChip>
        </div>
        <div className={styles.helper}>
          {suggestion.kind === 'median' ? 'A steady middle path.' : 'The party’s most chosen rune.'}
        </div>
      </div>
    </Panel>
  );
};
