import * as signalR from '@microsoft/signalr';
import { buildConnection, ConnectionParams } from './connection';
import type {
  HubClientEvents,
  HubServerMethods,
  RealtimeEventMap,
  SetDisplayNameRequest,
  SelectRuneRequest,
  StartEncounterRequest,
  RevealProphecyRequest,
  ReRollFatesRequest,
  SealOutcomeRequest,
  AddQuestRequest,
  UpdateQuestRequest,
  DeleteQuestRequest,
  ReorderQuestsRequest,
  SetActiveQuestRequest,
  JoinPresenceRequest,
  LeavePresenceRequest,
} from './types';

type EventHandler<T> = (payload: T) => void;

class TypedEventEmitter<Events extends Record<string, unknown>> {
  private listeners: { [K in keyof Events]?: Set<EventHandler<Events[K]>> } =
    {};

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
    this.listeners[event]?.delete(handler);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]) {
    this.listeners[event]?.forEach((handler) => handler(payload));
  }

  clear() {
    Object.keys(this.listeners).forEach((key) => {
      this.listeners[key as keyof Events]?.clear();
    });
  }
}

export interface RealmRealtimeClientOptions {
  baseUrl?: string;
  clientId?: string;
  debug?: boolean;
  buildConnection?: (params: ConnectionParams) => signalR.HubConnection;
  refreshMemberToken?: (params: {
    realmCode: string;
    clientId: string;
    memberToken: string;
  }) => Promise<string | null>;
}

export interface ConnectParams {
  realmCode: string;
  memberToken: string;
  clientId?: string;
}

const DEFAULT_DEBUG =
  (import.meta.env.VITE_REALTIME_DEBUG || '').toString().toLowerCase() ===
  'true';

export class RealmRealtimeClient {
  private connection: signalR.HubConnection | null = null;
  private connectPromise: Promise<void> | null = null;
  private emitter = new TypedEventEmitter<RealtimeEventMap>();
  private realmCode: string | null = null;
  private memberToken: string | null = null;
  private clientId: string | null = null;
  private readonly debug: boolean;
  private readonly buildConnectionFn: (params: ConnectionParams) => signalR.HubConnection;
  private readonly refreshMemberToken?: RealmRealtimeClientOptions['refreshMemberToken'];
  private handlersRegistered = false;
  private refreshInFlight = false;

  constructor(options: RealmRealtimeClientOptions = {}) {
    this.debug = options.debug ?? DEFAULT_DEBUG;
    this.buildConnectionFn = options.buildConnection ?? buildConnection;
    this.refreshMemberToken = options.refreshMemberToken;
    if (options.clientId) {
      this.clientId = options.clientId;
    }
  }

  on<K extends keyof RealtimeEventMap>(
    event: K,
    handler: EventHandler<RealtimeEventMap[K]>
  ) {
    return this.emitter.on(event, handler);
  }

  off<K extends keyof RealtimeEventMap>(
    event: K,
    handler: EventHandler<RealtimeEventMap[K]>
  ) {
    this.emitter.off(event, handler);
  }

  get connectionState() {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }

  async connect({ realmCode, memberToken, clientId }: ConnectParams): Promise<void> {
    const normalizedClientId = clientId ?? this.clientId;
    if (!normalizedClientId) {
      throw new Error('ClientId is required to connect.');
    }

    const sameTarget =
      this.realmCode === realmCode &&
      this.memberToken === memberToken &&
      this.clientId === normalizedClientId &&
      this.connection?.state === signalR.HubConnectionState.Connected;

    if (sameTarget) {
      return;
    }

    if (this.connectPromise && this.realmCode === realmCode) {
      return this.connectPromise;
    }

    if (this.connection) {
      await this.disconnect();
    }

    this.realmCode = realmCode;
    this.memberToken = memberToken;
    this.clientId = normalizedClientId;

    this.setStatus('connecting');

    this.connection = this.buildConnectionFn({
      realmCode,
      memberToken,
      clientId: normalizedClientId,
      debug: this.debug,
    });

    this.registerHandlers();

    this.connectPromise = this.startConnectionWithRetry();

    return this.connectPromise.finally(() => {
      this.connectPromise = null;
    });
  }

  async disconnect(): Promise<void> {
    this.connectPromise = null;
    if (!this.connection) {
      this.setStatus('disconnected');
      return;
    }
    this.unregisterHandlers();
    const connection = this.connection;
    this.connection = null;
    try {
      await connection.stop();
    } finally {
      this.setStatus('disconnected');
    }
  }

  async switchRealm(newRealmCode: string, newMemberToken: string) {
    await this.disconnect();
    const params: ConnectParams = {
      realmCode: newRealmCode,
      memberToken: newMemberToken,
    };
    if (this.clientId) {
      params.clientId = this.clientId;
    }
    return this.connect(params);
  }

  async requestFullSnapshot() {
    if (!this.connection || !this.realmCode) return;
    try {
      await this.invoke('RequestFullSnapshot');
    } catch {
      await this.invoke('JoinRealm', this.realmCode);
    }
  }

  async setDisplayName(request: SetDisplayNameRequest) {
    return this.invoke('SetDisplayName', this.withCommandId(request));
  }

  async joinPresence(request: JoinPresenceRequest = {}) {
    return this.invoke('JoinPresence', this.withCommandId(request));
  }

  async leavePresence(request: LeavePresenceRequest = {}) {
    return this.invoke('LeavePresence', this.withCommandId(request));
  }

  async selectRune(request: SelectRuneRequest) {
    return this.invoke('SelectRune', this.withCommandId(request));
  }

  async startEncounter(request: StartEncounterRequest) {
    return this.invoke('StartEncounter', this.withCommandId(request));
  }

  async revealProphecy(request: RevealProphecyRequest) {
    return this.invoke('RevealProphecy', this.withCommandId(request));
  }

  async reRollFates(request: ReRollFatesRequest) {
    return this.invoke('ReRollFates', this.withCommandId(request));
  }

  async sealOutcome(request: SealOutcomeRequest) {
    return this.invoke('SealOutcome', this.withCommandId(request));
  }

  async addQuest(request: AddQuestRequest) {
    return this.invoke('AddQuest', this.withCommandId(request));
  }

  async updateQuest(request: UpdateQuestRequest) {
    return this.invoke('UpdateQuest', this.withCommandId(request));
  }

  async deleteQuest(request: DeleteQuestRequest) {
    return this.invoke('DeleteQuest', this.withCommandId(request));
  }

  async reorderQuests(request: ReorderQuestsRequest) {
    return this.invoke('ReorderQuests', this.withCommandId(request));
  }

  async setActiveQuest(request: SetActiveQuestRequest) {
    return this.invoke('SetActiveQuest', this.withCommandId(request));
  }

  private async invoke<K extends keyof HubServerMethods>(
    method: K,
    ...args: Parameters<HubServerMethods[K]>
  ): Promise<Awaited<ReturnType<HubServerMethods[K]>>> {
    if (!this.connection || !this.memberToken || !this.realmCode) {
      throw new Error('Connection not initialized.');
    }
    if (this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('Connection is not ready.');
    }
    const result = await this.connection.invoke<Awaited<ReturnType<HubServerMethods[K]>>>(
      method,
      ...args
    );
    return result;
  }

  private withCommandId<T extends { commandId?: string }>(request: T): T {
    if (!request.commandId) {
      return { ...request, commandId: this.generateCommandId() };
    }
    return request;
  }

  private generateCommandId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  }

  private async startConnectionWithRetry() {
    if (!this.connection || !this.realmCode || !this.memberToken || !this.clientId) {
      return;
    }

    try {
      await this.connection.start();
      await this.connection.invoke('JoinRealm', this.realmCode);
      this.setStatus('connected');
      this.debugLog('connected');
    } catch (error) {
      if (await this.tryRefreshToken(error)) {
        return;
      }
      this.setStatus('error', {
        code: 'connection_failed',
        message: 'Unable to connect to the realm.',
        cause: error,
      });
      throw error;
    }
  }

  private registerHandlers() {
    if (!this.connection || this.handlersRegistered) return;

    const connection = this.connection;

    connection.on('RealmSnapshot', (payload: HubClientEvents['RealmSnapshot']) => {
      this.emitter.emit('realmSnapshot', payload);
    });
    connection.on(
      'RealmStateUpdated',
      (payload: HubClientEvents['RealmStateUpdated']) => {
        this.emitter.emit('realmStateUpdated', payload);
      }
    );
    connection.on(
      'PartyPresenceUpdated',
      (payload: HubClientEvents['PartyPresenceUpdated']) => {
        this.emitter.emit('partyPresenceUpdated', payload);
      }
    );
    connection.on(
      'EncounterUpdated',
      (payload: HubClientEvents['EncounterUpdated']) => {
        this.emitter.emit('encounterUpdated', payload);
      }
    );
    connection.on('Toast', (message: HubClientEvents['Toast']) => {
      this.emitter.emit('toast', message);
    });

    connection.onreconnecting(() => {
      this.setStatus('reconnecting');
      this.debugLog('reconnecting');
    });
    connection.onreconnected(() => {
      this.setStatus('connected');
      this.debugLog('reconnected');
      this.requestFullSnapshot().catch((error) => {
        this.debugLog('resync_failed', error);
      });
    });
    connection.onclose((error) => {
      if (error) {
        this.setStatus('error', {
          code: 'connection_closed',
          message: 'Connection closed unexpectedly.',
          cause: error,
        });
        this.tryRefreshToken(error).catch(() => undefined);
      } else {
        this.setStatus('disconnected');
      }
      this.debugLog('closed', error);
    });

    this.handlersRegistered = true;
  }

  private unregisterHandlers() {
    if (!this.connection || !this.handlersRegistered) return;
    this.connection.off('RealmSnapshot');
    this.connection.off('RealmStateUpdated');
    this.connection.off('PartyPresenceUpdated');
    this.connection.off('EncounterUpdated');
    this.connection.off('Toast');
    this.handlersRegistered = false;
  }

  private setStatus(
    status: RealtimeEventMap['connectionStatusChanged'],
    error?: RealtimeEventMap['error']
  ) {
    this.emitter.emit('connectionStatusChanged', status);
    if (error) {
      this.emitter.emit('error', error);
    }
  }

  private async tryRefreshToken(error: unknown) {
    if (!this.refreshMemberToken || this.refreshInFlight) {
      return false;
    }
    if (!this.isUnauthorized(error) || !this.realmCode || !this.memberToken || !this.clientId) {
      return false;
    }
    this.refreshInFlight = true;
    try {
      const refreshed = await this.refreshMemberToken({
        realmCode: this.realmCode,
        clientId: this.clientId,
        memberToken: this.memberToken,
      });
      if (!refreshed) {
        this.setStatus('error', {
          code: 'auth_refresh_failed',
          message: 'Access sigil expired. Please rejoin the realm.',
          cause: error,
        });
        return false;
      }
      this.memberToken = refreshed;
      await this.disconnect();
      await this.connect({
        realmCode: this.realmCode,
        memberToken: refreshed,
        clientId: this.clientId,
      });
      return true;
    } catch (refreshError) {
      this.setStatus('error', {
        code: 'auth_refresh_failed',
        message: 'Access sigil expired. Please rejoin the realm.',
        cause: refreshError,
      });
      return false;
    } finally {
      this.refreshInFlight = false;
    }
  }

  private isUnauthorized(error: unknown) {
    if (!error) return false;
    if (typeof error === 'string') {
      return error.includes('401') || error.toLowerCase().includes('unauthorized');
    }
    const err = error as { statusCode?: number; message?: string };
    if (err.statusCode === 401) return true;
    if (err.message) {
      return err.message.includes('401') || err.message.toLowerCase().includes('unauthorized');
    }
    return false;
  }

  private debugLog(message: string, error?: unknown) {
    if (!this.debug) return;
    if (error) {
      console.info(`[realtime] ${message}`, error);
    } else {
      console.info(`[realtime] ${message}`);
    }
  }
}
