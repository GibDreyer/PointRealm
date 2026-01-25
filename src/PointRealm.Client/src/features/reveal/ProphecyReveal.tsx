import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Encounter, PartyMember, Quest } from '@/types/realm';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Panel } from '@/components/ui/Panel';
import { useToast } from '@/components/ui/ToastSystem';
import { PartyVotesList } from './components/PartyVotesList';
import { VoteChart } from './components/VoteChart';
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
      .filter((val) => counts[val] !== undefined)
      .map((val) => ({ value: val, count: counts[val] ?? 0 }));
  }, [encounter.votes, deckValues, revealed]);

  const totalVotes = useMemo(() => {
    return Object.values(encounter.votes).filter(v => v).length;
  }, [encounter.votes]);

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
    const midPrev = numericVotes[mid - 1];
    const midVal = numericVotes[mid];
    
    if (midVal === undefined) return null;
    
    const median = numericVotes.length % 2 === 0 && midPrev !== undefined
      ? (midPrev + midVal) / 2
      : midVal;

    return { kind: 'median' as const, value: median.toString() };
  }, [revealed, voteRows]);

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <VignettePulse active={showVignette && !prefersReducedMotion} />

      <Panel className={styles.panel} noPadding>
        {/* Header with decorative elements */}
        <div className={styles.headerSection}>
          <div className={styles.headerDecor}>
            <div className={styles.decorLine} />
            <div className={styles.decorGem} />
            <div className={styles.decorLine} />
          </div>
          <motion.div 
            className={styles.header}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className={styles.mainTitle}>Prophecy Revealed</h1>
            <p className={styles.subtitle}>The runes have spoken</p>
          </motion.div>
        </div>

        {/* Quest Banner */}
        <motion.div 
          className={styles.banner}
          initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <span className={styles.bannerLabel}>Quest</span>
          <strong className={styles.bannerTitle}>{quest?.title ?? 'Unknown Quest'}</strong>
          {quest?.externalId && <span className={styles.bannerId}>{quest.externalId}</span>}
          {encounter.outcome !== undefined && encounter.outcome !== null && (
            <motion.span
              className={styles.stamp}
              initial={{ opacity: 0, scale: 0.9, rotate: prefersReducedMotion ? 0 : -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              ✓ Sealed
            </motion.span>
          )}
        </motion.div>

        {/* Suggested Oath - Prominent Center Display */}
        <motion.div 
          className={styles.oathSection}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SuggestedOathPanel suggestion={suggestion} />
        </motion.div>

        {/* Main Content Grid */}
        <div className={styles.grid}>
          {/* Chart Section */}
          <motion.div 
            className={styles.chartSection}
            initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <VoteChart 
              data={distribution} 
              revealed={revealed} 
              totalVotes={totalVotes}
            />
          </motion.div>

          {/* Party Votes Section */}
          <motion.div 
            className={styles.votesSection}
            initial={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <PartyVotesList
              rows={voteRows}
              deckValues={deckValues}
              revealed={revealed}
              hideVoteCounts={hideVoteCounts}
            />
          </motion.div>
        </div>

        {/* Actions Section */}
        {revealed && (
          <motion.div 
            className={styles.actionsRow}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <OutcomeActions
              deckValues={deckValues}
              isGM={isGM}
              isSealed={encounter.outcome !== undefined && encounter.outcome !== null}
              sealingValue={sealingValue}
              onReroll={onReroll}
              onSealOutcome={handleSeal}
            />
          </motion.div>
        )}
      </Panel>
    </div>
  );
};
