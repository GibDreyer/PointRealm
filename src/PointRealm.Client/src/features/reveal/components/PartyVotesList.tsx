import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';
import styles from './PartyVotesList.module.css';

export interface PartyVoteRow {
  id: string;
  name: string;
  voteValue: string | null;
}

interface PartyVotesListProps {
  rows: PartyVoteRow[];
  deckValues: string[];
  revealed: boolean;
  hideVoteCounts?: boolean;
  compact?: boolean;
}

type SortMode = 'rune' | 'name';

const getNumeric = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const PartyVotesList: React.FC<PartyVotesListProps> = ({
  rows,
  deckValues,
  revealed,
  hideVoteCounts = false,
  compact = false,
}) => {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [sortMode, setSortMode] = useState<SortMode>('rune');

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (sortMode === 'name') {
        return a.name.localeCompare(b.name);
      }
      const aIdx = a.voteValue ? deckValues.indexOf(a.voteValue) : Number.MAX_SAFE_INTEGER;
      const bIdx = b.voteValue ? deckValues.indexOf(b.voteValue) : Number.MAX_SAFE_INTEGER;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.name.localeCompare(b.name);
    });
  }, [rows, deckValues, sortMode]);

  const numericVotes = useMemo(() =>
    rows.map(r => getNumeric(r.voteValue)).filter((val): val is number => val !== null),
  [rows]);

  const minVote = numericVotes.length ? Math.min(...numericVotes) : null;
  const maxVote = numericVotes.length ? Math.max(...numericVotes) : null;

  const FlipChip: React.FC<{ value: string; shown: boolean }> = ({ value, shown }) => {
    const shouldFlip = shown && !prefersReducedMotion;
    return (
      <div className={styles.flipWrap}>
        <motion.div
          className={styles.flipInner}
          initial={false}
          animate={shouldFlip ? { rotateY: 180 } : { rotateY: 0, opacity: shown ? 1 : 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          data-flip={shouldFlip ? 'true' : 'false'}
        >
          <div className={styles.flipFace}>
            <div className={styles.valueChip}>—</div>
          </div>
          <div className={`${styles.flipFace} ${styles.flipBack}`}>
            <div className={styles.valueChip}>{value}</div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className={styles.section}>
      <div className={styles.headerRow}>
        <SectionHeader 
          title="Party Votes" 
          subtitle={compact ? undefined : "Votes"} 
          className="mb-0" 
        />
        <button
          type="button"
          className={styles.sortButton}
          onClick={() => setSortMode(sortMode === 'rune' ? 'name' : 'rune')}
        >
          Sort: {sortMode === 'rune' ? 'Rune' : 'Name'}
        </button>
      </div>

      {!hideVoteCounts && revealed && (
        <div className={styles.totalLabel}>{rows.length} votes</div>
      )}

      <div className={styles.list}>
        {sorted.map((member) => {
          const numeric = getNumeric(member.voteValue);
          const isMin = numeric !== null && minVote !== null && numeric === minVote;
          const isMax = numeric !== null && maxVote !== null && numeric === maxVote;
          const displayValue = revealed ? (member.voteValue ?? '—') : '—';

          return (
            <div
              key={member.id}
              className={cn(
                styles.row,
                isMin && styles.rowMin,
                isMax && styles.rowMax
              )}
            >
              <div className={styles.rowBadge}>{member.name.substring(0, 2).toUpperCase()}</div>
              <div className={styles.name}>{member.name}</div>
              <FlipChip value={displayValue} shown={revealed} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
