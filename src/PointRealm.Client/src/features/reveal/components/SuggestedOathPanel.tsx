import React from 'react';
import { SectionHeader } from '@/components/ui/SectionHeader';
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
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <div className={styles.panel}>
        <SectionHeader 
          title="Suggested Oath" 
          subtitle="Median/Mode suggestion" 
          className="mb-0 text-center" 
        />
        <div className={styles.chipWrap}>
          <div className={styles.runeValue}>
            {suggestion.value}
          </div>
        </div>
        <div className={styles.helper}>
          {suggestion.kind === 'median' ? 'A steady middle path.' : "The party's most chosen rune."}
        </div>
      </div>
    </div>
  );
};
