import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Encounter, PartyMember, Quest } from '@/types/realm';
import { Panel } from '@/components/ui/Panel';
import { useToast } from '@/components/ui/ToastSystem';
import { PartyVotesList } from './components/PartyVotesList';
import { VoteChart } from './components/VoteChart';
import { SuggestedOathPanel } from './components/SuggestedOathPanel';
import { OutcomeActions } from './components/OutcomeActions';
import { VignettePulse } from './components/VignettePulse';
import { SessionHighlights } from './components/SessionHighlights';
import { useProphecyStats, getNumericVote } from './utils/statsHooks';
import { useThemeMode } from '@/theme/ThemeModeProvider';
import styles from './ProphecyReveal.module.css';

interface ProphecyRevealProps {
  encounter: Encounter;
  partyRoster: PartyMember[];
  isGM: boolean;
  deckValues: string[];
  quest?: Quest | null;
  onSealOutcome: (value: string) => Promise<void>;
  onStartNextQuest: () => void;
  className?: string;
  hideVoteCounts?: boolean;
  minimal?: boolean;
  panelVariant?: 'default' | 'glow' | 'realm';
  actionsDisabled?: boolean;
}

// getNumericVote moved to statsHooks.ts

export const ProphecyReveal: React.FC<ProphecyRevealProps> = ({
  encounter,
  partyRoster,
  isGM,
  deckValues,
  quest,
  onSealOutcome,
  onStartNextQuest,
  className,
  hideVoteCounts = false,
  minimal = false,
  panelVariant = 'default',
  actionsDisabled = false,
}) => {
  const revealed = encounter.isRevealed;
  const prefersReducedMotion = useReducedMotion() ?? false;
  const { toast } = useToast();
  const { mode } = useThemeMode();
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
    if (actionsDisabled) return;
    if (sealingValue || (encounter.outcome !== undefined && encounter.outcome !== null)) return;
    setSealingValue(value);
    try {
      await onSealOutcome(value);
    } catch (err) {
      console.error('Failed to seal outcome', err);
      setSealingValue(null);
    }
  };

  const {
    voteRows,
    distribution,
    totalVotes,
    spread,
    sessionHighlights,
    insightChips,
  } = useProphecyStats(encounter, partyRoster, deckValues);

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

      <Panel className={styles.panel} noPadding variant={panelVariant}>
        {/* Header Section */}
        <div className={styles.topRow}>
          <div className={styles.headerSection}>
            <motion.div 
              className={styles.header}
              initial={prefersReducedMotion ? {} : { opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className={styles.mainTitle}>
                {minimal ? mode.labels.prophecy : `${mode.labels.prophecy} Revealed`}
              </h1>
              {!minimal && (
                <p className={styles.subtitle}>
                  {mode.key === 'fantasy' ? 'The runes have spoken' : 'The votes are in'}
                </p>
              )}
            </motion.div>
          </div>

          {/* Suggested Oath / Suggestion (Top Right) */}
          <motion.div 
            className={styles.oathSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
             <SuggestedOathPanel suggestion={suggestion} />
          </motion.div>
        </div>

        {/* Quest Banner - Always Visible */}
        {!minimal && (
          <motion.div 
            className={styles.banner}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className={styles.bannerLabel}>{mode.labels.quest}</span>
            <strong className={styles.bannerTitle}>{quest?.title ?? `Unknown ${mode.labels.quest}`}</strong>
            {quest?.externalId && <span className={styles.bannerId}>{quest.externalId}</span>}
            {encounter.outcome !== undefined && encounter.outcome !== null && (
               <span className={styles.stamp}>✓ Sealed</span>
            )}
          </motion.div>
        )}

        {revealed && (sessionHighlights.length > 0 || insightChips.length > 0) && (
          <SessionHighlights
            highlights={sessionHighlights}
            insights={insightChips}
          />
        )}

        <div className="relative min-h-[400px] flex flex-col p-6">
           <div className={minimal ? "grid grid-cols-1 sm:grid-cols-2 gap-6 h-full min-h-0" : styles.grid}>
              <div className={minimal ? "min-h-0 overflow-visible" : styles.chartSection}>
                <VoteChart 
                  data={distribution} 
                  revealed={revealed} 
                  totalVotes={totalVotes}
                  compact={minimal}
                  spread={spread}
                />
              </div>
              <div className={minimal ? "min-h-0 overflow-y-auto" : styles.votesSection}>
                <PartyVotesList
                  rows={voteRows}
                  deckValues={deckValues}
                  revealed={revealed}
                  hideVoteCounts={hideVoteCounts}
                  compact={minimal}
                />
              </div>
            </div>
            
            {/* Actions (GM Only) */}
            {revealed && isGM && (
              <div className={styles.actionsRow}>
                <OutcomeActions
                  deckValues={deckValues}
                  isGM={isGM}
                  isSealed={encounter.outcome !== undefined && encounter.outcome !== null}
                  sealingValue={sealingValue}
                  onStartNextQuest={onStartNextQuest}
                  onSealOutcome={handleSeal}
                  actionsDisabled={actionsDisabled}
                />
              </div>
            )}
        </div>
      </Panel>
    </div>
  );
};
