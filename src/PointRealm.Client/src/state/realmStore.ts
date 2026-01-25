import { create } from 'zustand';
import type { ConnectionStatus, EncounterDto, PartyRosterDto } from '@/realtime/types';
import type { RealmStateDto } from '@/types/realm';

export type RealmStoreError = { code: string; message: string };

export type RealmServerEvent =
  | { type: 'realmStateUpdated'; payload: RealmStateDto }
  | { type: 'partyPresenceUpdated'; payload: PartyRosterDto }
  | { type: 'encounterUpdated'; payload: EncounterDto };

export interface RealmStoreState {
  connectionStatus: ConnectionStatus;
  lastError?: RealmStoreError;
  realmSnapshot?: RealmStateDto;
  presence?: PartyRosterDto;
  encounter?: EncounterDto | null;
  serverRevision?: number;
  applyServerSnapshot: (snapshot: RealmStateDto) => void;
  applyServerEvent: (event: RealmServerEvent) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastError: (error?: RealmStoreError) => void;
  clear: () => void;
}

function extractRevision(snapshot: RealmStateDto) {
  const anySnapshot = snapshot as RealmStateDto & {
    revision?: number;
    serverRevision?: number;
    sequence?: number;
    realmVersion?: number;
  };
  return (
    anySnapshot.revision ??
    anySnapshot.serverRevision ??
    anySnapshot.sequence ??
    anySnapshot.realmVersion ??
    undefined
  );
}

export const useRealmStore = create<RealmStoreState>((set, get) => ({
  connectionStatus: 'disconnected',
  lastError: undefined,
  realmSnapshot: undefined,
  presence: undefined,
  encounter: undefined,
  serverRevision: undefined,
  applyServerSnapshot: (snapshot) => {
    const incomingRevision = extractRevision(snapshot);
    const currentRevision = get().serverRevision;
    if (
      incomingRevision !== undefined &&
      currentRevision !== undefined &&
      incomingRevision < currentRevision
    ) {
      return;
    }
    set({
      realmSnapshot: snapshot,
      presence: snapshot.partyRoster,
      encounter: snapshot.encounter,
      serverRevision:
        incomingRevision !== undefined ? incomingRevision : currentRevision,
    });
  },
  applyServerEvent: (event) => {
    const snapshotExists = !!get().realmSnapshot;
    if (!snapshotExists && event.type !== 'realmStateUpdated') {
      return;
    }
    if (event.type === 'realmStateUpdated') {
      get().applyServerSnapshot(event.payload);
      return;
    }
    if (event.type === 'partyPresenceUpdated') {
      set({ presence: event.payload });
      return;
    }
    if (event.type === 'encounterUpdated') {
      set({ encounter: event.payload });
    }
  },
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setLastError: (error) => set({ lastError: error }),
  clear: () =>
    set({
      connectionStatus: 'disconnected',
      lastError: undefined,
      realmSnapshot: undefined,
      presence: undefined,
      encounter: undefined,
      serverRevision: undefined,
    }),
}));
