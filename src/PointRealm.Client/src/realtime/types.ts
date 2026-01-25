import { Encounter, RealmStateDto } from '@/types/realm';
import type { LobbySnapshot } from '@/features/realmLobby/types';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type PartyRosterDto = RealmStateDto['partyRoster'];
export type EncounterDto = Encounter;

export interface ServerToast {
  message: string;
}

export interface HubClientEvents {
  RealmSnapshot: LobbySnapshot;
  RealmStateUpdated: RealmStateDto;
  PartyPresenceUpdated: PartyRosterDto;
  EncounterUpdated: EncounterDto;
  Toast: string;
}

export interface HubServerMethods {
  JoinRealm: (realmCode: string) => Promise<void>;
  RequestFullSnapshot: () => Promise<void>;
  SetDisplayName: (name: string) => Promise<void>;
  SelectRune: (value: string) => Promise<void>;
  StartEncounter: (questId: string) => Promise<void>;
  RevealProphecy: () => Promise<void>;
  ReRollFates: () => Promise<void>;
  SealOutcome: (value: number) => Promise<void>;
  AddQuest: (title: string, description: string) => Promise<string>;
  UpdateQuest: (questId: string, title: string, description: string) => Promise<void>;
  DeleteQuest: (questId: string) => Promise<void>;
  ReorderQuests: (newOrderKeys: string[]) => Promise<void>;
}

export type RealtimeEventMap = {
  realmSnapshot: LobbySnapshot;
  realmStateUpdated: RealmStateDto;
  partyPresenceUpdated: PartyRosterDto;
  encounterUpdated: EncounterDto;
  toast: string;
  connectionStatusChanged: ConnectionStatus;
  error: { code: string; message: string; cause?: unknown };
};
