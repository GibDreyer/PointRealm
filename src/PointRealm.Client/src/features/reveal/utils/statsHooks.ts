
import { useMemo } from 'react';
import { Encounter, PartyMember } from '@/types/realm';

export function getNumericVote(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useProphecyStats(encounter: Encounter, partyRoster: PartyMember[], deckValues: string[]) {
  const revealed = encounter.isRevealed;

  const voteRows = useMemo(() => {
    return partyRoster
      .filter(member => member.status !== 'disconnected')
      .map(member => ({
        id: member.id,
        name: member.name,
        avatarEmoji: member.avatarEmoji ?? null,
        profileImageUrl: member.profileImageUrl ?? null,
        profileEmoji: member.profileEmoji ?? null,
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

  const spread = useMemo(() => {
    if (!revealed) return null;
    const numericVotes = voteRows
      .map(row => getNumericVote(row.voteValue))
      .filter((val): val is number => val !== null);
    
    if (numericVotes.length < 2) return null;
    return Math.max(...numericVotes) - Math.min(...numericVotes);
  }, [revealed, voteRows]);

  const stats = useMemo(() => {
    if (!distribution.length) return null;
    const numericData = distribution
      .filter(d => !isNaN(Number(d.value)))
      .map(d => ({ value: Number(d.value), count: d.count }));
    
    if (!numericData.length) return null;
    
    const totalWeight = numericData.reduce((sum, d) => sum + d.count, 0);
    const weightedSum = numericData.reduce((sum, d) => sum + d.value * d.count, 0);
    const average = weightedSum / totalWeight;
    
    return { average: average.toFixed(1) };
  }, [distribution]);

  const consensusText = useMemo(() => {
    if (spread === null) return "Unknown";
    if (spread === 0) return "Unanimous";
    if (spread <= 1) return "High Consensus";
    if (spread <= 2) return "Strong Agreement";
    if (spread <= 3) return "Moderate Spread";
    return "Divided Opinion";
  }, [spread]);

  const consensusColor = useMemo(() => {
    if (spread === null) return "text-pr-text-muted";
    if (spread <= 2) return "text-pr-success";
    if (spread <= 5) return "text-pr-warning";
    return "text-pr-danger";
  }, [spread]);

  return {
    voteRows,
    distribution,
    totalVotes,
    spread,
    stats,
    consensusText,
    consensusColor
  };
}
