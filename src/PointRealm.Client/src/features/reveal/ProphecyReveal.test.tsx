import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { ToastProvider } from '@/components/ui/ToastSystem';
import type { Encounter, PartyMember, Quest } from '@/types/realm';

const baseEncounter = (overrides?: Partial<Encounter>): Encounter => ({
  questId: 'quest-1',
  isRevealed: true,
  votes: {},
  distribution: {},
  ...overrides,
} as Encounter);

const partyRoster: PartyMember[] = [
  { id: 'm1', name: 'Aria', role: 'Member', status: 'ready', isOnline: true },
  { id: 'm2', name: 'Bryn', role: 'Member', status: 'ready', isOnline: true },
];

const quest: Quest = {
  id: 'quest-1',
  title: 'Forge the Estimate',
  description: '',
  status: 'Open',
  order: 1,
};

const renderReveal = async (opts: {
  encounter?: Encounter;
  isGM?: boolean;
  reducedMotion?: boolean;
}) => {
  const reduced = opts.reducedMotion ?? false;
  vi.resetModules();
  vi.doMock('framer-motion', async () => {
    const actual = await vi.importActual<any>('framer-motion');
    return { ...actual, useReducedMotion: () => reduced };
  });

  const { ProphecyReveal } = await import('./ProphecyReveal');

  return render(
    <ToastProvider>
      <ProphecyReveal
        encounter={opts.encounter ?? baseEncounter()}
        partyRoster={partyRoster}
        isGM={opts.isGM ?? false}
        deckValues={['1', '2', '3', '5', '8']}
        quest={quest}
        onSealOutcome={async () => {}}
        onReroll={() => {}}
        hideVoteCounts={false}
      />
    </ToastProvider>
  );
};

describe('ProphecyReveal', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('does not render vote values when not revealed', async () => {
    await renderReveal({
      encounter: baseEncounter({
        isRevealed: false,
        votes: { m1: '13', m2: '8' },
      }),
      isGM: true,
    });

    expect(screen.queryByText('13')).not.toBeInTheDocument();
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });

  it('renders GM-only seal options only for GM', async () => {
    await renderReveal({
      encounter: baseEncounter({
        isRevealed: true,
        votes: {},
      }),
      isGM: false,
    });

    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('disables flips when reduced motion is enabled', async () => {
    const { container } = await renderReveal({
      encounter: baseEncounter({
        isRevealed: true,
        votes: { m1: '5', m2: '8' },
      }),
      isGM: true,
      reducedMotion: true,
    });

    expect(container.querySelectorAll('[data-flip="true"]').length).toBe(0);
  });
});
