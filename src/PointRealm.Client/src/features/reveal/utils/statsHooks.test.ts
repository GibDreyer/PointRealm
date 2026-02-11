import { describe, expect, it } from 'vitest';
import { getSessionHighlights } from './statsHooks';

describe('getSessionHighlights', () => {
  it('returns unanimous badge for zero spread with enough votes', () => {
    expect(getSessionHighlights({ spread: 0, totalVotes: 4 })).toEqual([
      { id: 'unanimous', label: 'Unanimous 🔥', tone: 'success' },
    ]);
  });

  it('returns tight consensus badge for spread of one', () => {
    expect(getSessionHighlights({ spread: 1, totalVotes: 5 })).toEqual([
      { id: 'tight-consensus', label: 'Tight Consensus 🎯', tone: 'success' },
    ]);
  });

  it('returns wild spread badge for high spread', () => {
    expect(getSessionHighlights({ spread: 8, totalVotes: 5 })).toEqual([
      { id: 'wild-spread', label: 'Wild Spread 🌪️', tone: 'danger' },
    ]);
  });

  it('returns no badges for insufficient votes', () => {
    expect(getSessionHighlights({ spread: 0, totalVotes: 1 })).toEqual([]);
  });
});
