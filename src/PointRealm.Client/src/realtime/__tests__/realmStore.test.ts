import { describe, it, expect, beforeEach } from 'vitest';
import { useRealmStore } from '@/state/realmStore';
import type { RealmStateDto } from '@/types/realm';

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
    const snapshot: RealmStateDto = {
      realmCode: 'ABC',
      themeKey: 'dark-fantasy-arcane',
      settings: { deckType: 'FIBONACCI', autoReveal: false, allowAbstain: true, hideVoteCounts: false, allowEmojiReactions: true },
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
    const baseSnapshot: RealmStateDto & { revision: number } = {
      realmCode: 'ABC',
      themeKey: 'dark-fantasy-arcane',
      settings: { deckType: 'FIBONACCI', autoReveal: false, allowAbstain: true, hideVoteCounts: false, allowEmojiReactions: true },
      partyRoster: { members: [] },
      questLog: { quests: [] },
      encounter: null,
      revision: 10,
    };

    const staleSnapshot: RealmStateDto & { revision: number } = {
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
