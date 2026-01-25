import { describe, it, expect, beforeEach } from 'vitest';
import { useRealmStore } from '@/state/realmStore';

describe('realmStore', () => {
  beforeEach(() => {
    useRealmStore.setState({
      connectionStatus: 'disconnected',
      lastError: undefined,
      realmSnapshot: undefined,
      presence: undefined,
      encounter: undefined,
      serverRevision: undefined,
    });
  });

  it('applies server snapshot to store', () => {
    const snapshot: any = {
      realmCode: 'ABC',
      themeKey: 'dark-fantasy-arcane',
      settings: { deckType: 'FIBONACCI', autoReveal: false, allowAbstain: true, hideVoteCounts: false },
      partyRoster: { members: [] },
      questLog: { quests: [] },
      encounter: null,
    };

    useRealmStore.getState().applyServerSnapshot(snapshot);

    const state = useRealmStore.getState();
    expect(state.realmSnapshot?.realmCode).toBe('ABC');
    expect(state.presence).toEqual(snapshot.partyRoster);
    expect(state.encounter).toBeNull();
  });

  it('ignores stale snapshots by revision', () => {
    const baseSnapshot: any = {
      realmCode: 'ABC',
      themeKey: 'dark-fantasy-arcane',
      settings: { deckType: 'FIBONACCI', autoReveal: false, allowAbstain: true, hideVoteCounts: false },
      partyRoster: { members: [] },
      questLog: { quests: [] },
      encounter: null,
      revision: 10,
    };

    const staleSnapshot: any = {
      ...baseSnapshot,
      realmCode: 'XYZ',
      revision: 9,
    };

    useRealmStore.getState().applyServerSnapshot(baseSnapshot);
    useRealmStore.getState().applyServerSnapshot(staleSnapshot);

    const state = useRealmStore.getState();
    expect(state.realmSnapshot?.realmCode).toBe('ABC');
    expect(state.serverRevision).toBe(10);
  });
});
