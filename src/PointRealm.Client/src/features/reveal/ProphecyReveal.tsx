import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Encounter, PartyMember, Quest } from '@/types/realm';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Panel } from '@/components/ui/Panel';
import { useToast } from '@/components/ui/ToastSystem';
import { PartyVotesList } from './components/PartyVotesList';
import { RuneDistributionList } from './components/RuneDistributionList';
import { SuggestedOathPanel } from './components/SuggestedOathPanel';
import { OutcomeActions } from './components/OutcomeActions';
import { VignettePulse } from './components/VignettePulse';
import styles from './ProphecyReveal.module.css';

interface ProphecyRevealProps {
  encounter: Encounter;
  partyRoster: PartyMember[];
  isGM: boolean;
  deckValues: string[];
  quest?: Quest | null;
  onSealOutcome: (value: string) => Promise<void>;
  onReroll: () => void;
  className?: string;
  hideVoteCounts?: boolean;
}

const getNumericVote = (value: string | null) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const ProphecyReveal: React.FC<ProphecyRevealProps> = ({
  encounter,
  partyRoster,
  isGM,
  deckValues,
  quest,
  onSealOutcome,
  onReroll,
  className,
  hideVoteCounts = false,
}) => {
  const revealed = encounter.isRevealed;
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { toast } = useToast();
  const [showVignette, setShowVignette] = useState(false);
  const [sealingValue, setSealingValue] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] = useState<number | null>(null);

  useEffect(() => {
    if (revealed) {
      setShowVignette(true);
      const timer = setTimeout(() => setShowVignette(false), 500);
      return () => clearTimeout(timer);
    }
  }, [revealed]);

  useEffect(() => {
    if (encounter.outcome !== undefined && encounter.outcome !== null && encounter.outcome !== lastOutcome) {
      toast(`Outcome sealed: ${encounter.outcome}`, 'success');
      setLastOutcome(encounter.outcome);
      setSealingValue(null);
    }
  }, [encounter.outcome, lastOutcome, toast]);

  const handleSeal = async (value: string) => {
    if (sealingValue || (encounter.outcome !== undefined && encounter.outcome !== null)) return;
    setSealingValue(value);
    try {
      await onSealOutcome(value);
    } catch (err) {
      console.error('Failed to seal outcome', err);
      setSealingValue(null);
    }
  };

  const voteRows = useMemo(() => {
    return partyRoster
      .filter(member => member.status !== 'disconnected')
      .map(member => ({
        id: member.id,
        name: member.name,
        voteValue: revealed ? encounter.votes[member.id] ?? null : null,
      }));
  }, [partyRoster, encounter.votes, revealed]);

  const distribution = useMemo(() => {
    if (!revealed) return [];
    const counts: Record<string, number> = {};
    Object.values(encounter.votes).forEach((val) => {
      if (!val) return;
      counts[val] = (counts[val] || 0) + 1;
    });

    return deckValues
      .filter((val) => counts[val])
      .map((val) => ({ value: val, count: counts[val] }));
  }, [encounter.votes, deckValues, revealed]);

  const suggestion = useMemo(() => {
    if (!revealed) return null;
    const numericVotes = voteRows
      .map(row => getNumericVote(row.voteValue))
      .filter((val): val is number => val !== null)
      .sort((a, b) => a - b);

    if (!numericVotes.length) return null;

    const counts = new Map<number, number>();
    numericVotes.forEach(val => counts.set(val, (counts.get(val) || 0) + 1));
    const modeEntry = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

    if (modeEntry && modeEntry[1] > 1) {
      return { kind: 'mode' as const, value: modeEntry[0].toString() };
    }

    const mid = Math.floor(numericVotes.length / 2);
    const median = numericVotes.length % 2 === 0
      ? (numericVotes[mid - 1] + numericVotes[mid]) / 2
      : numericVotes[mid];

    return { kind: 'median' as const, value: median.toString() };
  }, [revealed, voteRows]);

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <VignettePulse active={showVignette && !prefersReducedMotion} />

      <Panel className={styles.panel} noPadding>
        <div className={styles.header}>
          <SectionHeader
            title="Reveal the Prophecy"
            subtitle="Encounter Results"
            align="center"
            className="mb-0"
          />
        </div>

        <div className={styles.banner}>
          <span>Current Quest (Issue)</span>
          <strong>{quest?.title ?? 'Unknown Quest'}</strong>
          {quest?.externalId && <span className={styles.bannerId}>{quest.externalId}</span>}
          {encounter.outcome !== undefined && encounter.outcome !== null && (
            <motion.span
              className={styles.stamp}
              initial={{ opacity: 0, scale: 0.9, rotate: prefersReducedMotion ? 0 : -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              Bound by Oath
            </motion.span>
          )}
        </div>

        <div className={styles.grid}>
          <div>
            <PartyVotesList
              rows={voteRows}
              deckValues={deckValues}
              revealed={revealed}
              hideVoteCounts={hideVoteCounts}
            />
          </div>

          <div className={styles.rightColumn}>
            <SuggestedOathPanel suggestion={suggestion} />
            <RuneDistributionList distribution={distribution} revealed={revealed} />
          </div>
        </div>

        {revealed && (
          <div className={styles.actionsRow}>
            <OutcomeActions
              deckValues={deckValues}
              isGM={isGM}
              isSealed={encounter.outcome !== undefined && encounter.outcome !== null}
              sealingValue={sealingValue}
              onReroll={onReroll}
              onSealOutcome={handleSeal}
            />
          </div>
        )}
      </Panel>
    </div>
  );
};
