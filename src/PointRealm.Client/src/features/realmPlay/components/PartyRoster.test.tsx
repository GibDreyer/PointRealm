import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PartyRoster } from './PartyRoster';

const mockMembers = [
  { id: '1', name: 'User1', role: 'gm' as const, presence: 'online' as const, hasVoted: true },
  { id: '2', name: 'User2', role: 'player' as const, presence: 'online' as const, hasVoted: false },
  { id: '3', name: 'User3', role: 'player' as const, presence: 'online' as const, hasVoted: true },
];

describe('PartyRoster', () => {
  it('renders all members', () => {
    render(
      <PartyRoster
        members={mockMembers}
        totalVoters={2}
        votedCount={2}
      />
    );
    expect(screen.getByText('User1')).toBeInTheDocument();
    expect(screen.getByText('User2')).toBeInTheDocument();
    expect(screen.getByText('User3')).toBeInTheDocument();
  });

  it('shows hiding status when hideVoteCounts is true', () => {
    render(
      <PartyRoster
        members={mockMembers}
        totalVoters={2}
        votedCount={2}
        hideVoteCounts={true}
      />
    );
    // Should see "Ready" instead of visual indicator or exact counts contextually if we check the dot logic
    // But explicitly checks "Ready" text for voted members
    const readyLabels = screen.getAllByText('Ready');
    expect(readyLabels.length).toBe(2); // User1 and User3 have voted
  });

  it('does not show vote count header when hidden', () => {
    render(
      <PartyRoster
        members={mockMembers}
        totalVoters={2}
        votedCount={2}
        hideVoteCounts={true}
      />
    );
    // The "2/2 Voted" text should not be present
    expect(screen.queryByText(/Voted/)).not.toBeInTheDocument(); 
  });

  it('shows vote count header when not hidden', () => {
    render(
      <PartyRoster
        members={mockMembers}
        totalVoters={2}
        votedCount={2}
        hideVoteCounts={false}
      />
    );
    expect(screen.getByText('2/2 Voted')).toBeInTheDocument();
  });
});
