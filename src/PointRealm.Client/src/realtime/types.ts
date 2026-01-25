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

export interface CommandError {
  errorCode: string;
  message: string;
  details?: string;
  realmCode?: string;
  serverNow?: string;
}

export interface CommandResult<T = void> {
  success: boolean;
  payload?: T;
  error?: CommandError;
}

export interface SetDisplayNameRequest {
  name: string;
  commandId?: string;
}

export interface SelectRuneRequest {
  value: string;
  encounterVersion: number;
  commandId?: string;
}

export interface StartEncounterRequest {
  questId: string;
  realmVersion: number;
  questVersion: number;
  commandId?: string;
}

export interface RevealProphecyRequest {
  encounterVersion: number;
  commandId?: string;
}

export interface ReRollFatesRequest {
  encounterVersion: number;
  commandId?: string;
}

export interface SealOutcomeRequest {
  finalValue: number;
  encounterVersion: number;
  commandId?: string;
}

export interface AddQuestRequest {
  title: string;
  description: string;
  questLogVersion: number;
  commandId?: string;
}

export interface UpdateQuestRequest {
  questId: string;
  title: string;
  description: string;
  questVersion: number;
  commandId?: string;
}

export interface DeleteQuestRequest {
  questId: string;
  questVersion: number;
  questLogVersion: number;
  commandId?: string;
}

export interface ReorderQuestsRequest {
  newOrder: string[];
  questLogVersion: number;
  commandId?: string;
}

export interface SetActiveQuestRequest {
  questId: string;
  questLogVersion: number;
  commandId?: string;
}

export interface JoinPresenceRequest {
  commandId?: string;
}

export interface LeavePresenceRequest {
  commandId?: string;
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
  SetDisplayName: (request: SetDisplayNameRequest) => Promise<CommandResult>;
  JoinPresence: (request: JoinPresenceRequest) => Promise<CommandResult>;
  LeavePresence: (request: LeavePresenceRequest) => Promise<CommandResult>;
  SelectRune: (request: SelectRuneRequest) => Promise<CommandResult>;
  StartEncounter: (request: StartEncounterRequest) => Promise<CommandResult>;
  RevealProphecy: (request: RevealProphecyRequest) => Promise<CommandResult>;
  ReRollFates: (request: ReRollFatesRequest) => Promise<CommandResult>;
  SealOutcome: (request: SealOutcomeRequest) => Promise<CommandResult>;
  AddQuest: (request: AddQuestRequest) => Promise<CommandResult<string>>;
  UpdateQuest: (request: UpdateQuestRequest) => Promise<CommandResult>;
  DeleteQuest: (request: DeleteQuestRequest) => Promise<CommandResult>;
  ReorderQuests: (request: ReorderQuestsRequest) => Promise<CommandResult>;
  SetActiveQuest: (request: SetActiveQuestRequest) => Promise<CommandResult>;
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
