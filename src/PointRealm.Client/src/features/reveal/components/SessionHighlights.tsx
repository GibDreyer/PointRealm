import React from 'react';
import { cn } from '@/lib/utils';
import { SessionHighlight } from '../utils/statsHooks';
import styles from './SessionHighlights.module.css';

interface InsightChip {
  id: string;
  label: string;
  detail: string;
}

interface SessionHighlightsProps {
  highlights: SessionHighlight[];
  insights: InsightChip[];
  className?: string;
}

export const SessionHighlights: React.FC<SessionHighlightsProps> = ({
  highlights,
  insights,
  className,
}) => {
  if (highlights.length === 0 && insights.length === 0) {
    return null;
  }

  return (
    <section className={cn(styles.wrapper, className)} aria-label="Session highlights">
      {highlights.length > 0 && (
        <div className={styles.badges}>
          {highlights.map((badge) => (
            <span key={badge.id} className={cn(styles.badge, styles[`badge${badge.tone}`])}>
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {insights.length > 0 && (
        <div className={styles.insights}>
          {insights.map((insight) => (
            <article key={insight.id} className={styles.insightChip}>
              <p className={styles.insightLabel}>{insight.label}</p>
              <p className={styles.insightDetail}>{insight.detail}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
