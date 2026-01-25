import React from 'react';
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
      <div className={styles.runeContainer}>
        <div className={styles.runeValue}>
          {suggestion.value}
        </div>
      </div>
      <div className={styles.textContent}>
        <div className={styles.titleRow}>
          <span className={styles.label}>Suggested Oath</span>
          <div className={styles.titleLine} />
        </div>
        <div className={styles.helper}>
          {suggestion.kind === 'median' ? 'A steady middle path.' : "The party's most chosen rune."}
        </div>
      </div>
    </div>
  );
};
