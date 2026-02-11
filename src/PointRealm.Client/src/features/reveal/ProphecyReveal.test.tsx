import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import type { Encounter, PartyMember, Quest } from '@/types/realm';
import { ProphecyReveal } from './ProphecyReveal';
import { ToastProvider } from '@/components/ui/ToastSystem';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ThemeModeProvider } from '@/theme/ThemeModeProvider';

let reducedMotion = false;

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => reducedMotion,
  };
});

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
  orderIndex: 1,
};

const renderReveal = (opts: {
  encounter?: Encounter;
  isGM?: boolean;
  reducedMotion?: boolean;
}) => {
  reducedMotion = opts.reducedMotion ?? false;

  return render(
    <ThemeProvider>
      <ThemeModeProvider>
        <ToastProvider>
          <ProphecyReveal
            encounter={opts.encounter ?? baseEncounter()}
            partyRoster={partyRoster}
            isGM={opts.isGM ?? false}
            deckValues={['1', '2', '3', '5', '8']}
            quest={quest}
            onSealOutcome={async () => {}}
            onStartNextQuest={() => {}}
            hideVoteCounts={false}
          />
        </ToastProvider>
      </ThemeModeProvider>
    </ThemeProvider>
  );
};

describe('ProphecyReveal', () => {
  it('does not render vote values when not revealed', () => {
    renderReveal({
      encounter: baseEncounter({
        isRevealed: false,
        votes: { m1: '13', m2: '8' },
      }),
      isGM: true,
    });

    expect(screen.queryByText('13')).not.toBeInTheDocument();
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });

  it('renders GM-only seal options only for GM', () => {
    renderReveal({
      encounter: baseEncounter({
        isRevealed: true,
        votes: {},
      }),
      isGM: false,
    });

    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });


  it('renders session badge and insights when revealed numeric data is valid', () => {
    renderReveal({
      encounter: baseEncounter({
        isRevealed: true,
        votes: { m1: '8', m2: '8' },
      }),
      isGM: false,
    });

    expect(screen.getByText('Unanimous 🔥')).toBeInTheDocument();
    expect(screen.getByText('8 led the picks')).toBeInTheDocument();
    expect(screen.getByText('Party average: 8.0')).toBeInTheDocument();
  });

  it('does not render session highlights when data is hidden or invalid', () => {
    renderReveal({
      encounter: baseEncounter({
        isRevealed: false,
        votes: { m1: 'coffee', m2: null },
      }),
      isGM: false,
    });

    expect(screen.queryByLabelText('Session highlights')).not.toBeInTheDocument();
  });

  it('disables flips when reduced motion is enabled', () => {
    const { container } = renderReveal({
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
