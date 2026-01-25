import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HubConnectionState } from '@microsoft/signalr';
import { RealmRealtimeClient } from '../realmClient';

class FakeConnection {
  state = HubConnectionState.Disconnected;
  start = vi.fn(async () => {
    this.state = HubConnectionState.Connected;
  });
  stop = vi.fn(async () => {
    this.state = HubConnectionState.Disconnected;
  });
  invoke = vi.fn(async () => undefined);
  on = vi.fn((_event: string, _handler: (...args: any[]) => void) => undefined);
  off = vi.fn((_event: string) => undefined);
  onreconnecting = vi.fn((handler: () => void) => {
    this.reconnectingHandler = handler;
  });
  onreconnected = vi.fn((handler: () => void) => {
    this.reconnectedHandler = handler;
  });
  onclose = vi.fn((handler: (error?: Error) => void) => {
    this.closeHandler = handler;
  });

  reconnectingHandler?: () => void;
  reconnectedHandler?: () => void;
  closeHandler?: (error?: Error) => void;
}

describe('RealmRealtimeClient', () => {
  let connection: FakeConnection;

  beforeEach(() => {
    connection = new FakeConnection();
  });

  it('connect registers handlers once', async () => {
    const buildConnection = vi.fn(() => connection as any);
    const client = new RealmRealtimeClient({
      clientId: 'client-1',
      buildConnection,
    });

    await client.connect({ realmCode: 'ABC', memberToken: 'token', clientId: 'client-1' });
    await client.connect({ realmCode: 'ABC', memberToken: 'token', clientId: 'client-1' });

    expect(buildConnection).toHaveBeenCalledTimes(1);
    expect(connection.on).toHaveBeenCalledTimes(5);
  });

  it('disconnect stops connection and removes handlers', async () => {
    const buildConnection = vi.fn(() => connection as any);
    const client = new RealmRealtimeClient({
      clientId: 'client-1',
      buildConnection,
    });

    await client.connect({ realmCode: 'ABC', memberToken: 'token', clientId: 'client-1' });
    await client.disconnect();

    expect(connection.stop).toHaveBeenCalledTimes(1);
    expect(connection.off).toHaveBeenCalledWith('RealmSnapshot');
    expect(connection.off).toHaveBeenCalledWith('RealmStateUpdated');
  });

  it('reconnect triggers resync', async () => {
    const buildConnection = vi.fn(() => connection as any);
    const client = new RealmRealtimeClient({
      clientId: 'client-1',
      buildConnection,
    });

    await client.connect({ realmCode: 'ABC', memberToken: 'token', clientId: 'client-1' });
    connection.reconnectedHandler?.();

    expect(connection.invoke).toHaveBeenCalledWith('RequestFullSnapshot');
  });

  it('unauthorized attempts refresh and reconnect', async () => {
    const firstConnection = new FakeConnection();
    firstConnection.start = vi.fn(async () => {
      throw new Error('Unauthorized');
    });
    const secondConnection = new FakeConnection();

    const buildConnection = vi.fn()
      .mockReturnValueOnce(firstConnection as any)
      .mockReturnValueOnce(secondConnection as any);

    const refreshMemberToken = vi.fn(async () => 'new-token');

    const client = new RealmRealtimeClient({
      clientId: 'client-1',
      buildConnection,
      refreshMemberToken,
    });

    await client.connect({ realmCode: 'ABC', memberToken: 'token', clientId: 'client-1' });

    expect(refreshMemberToken).toHaveBeenCalledTimes(1);
    expect(buildConnection).toHaveBeenCalledTimes(2);
    expect(secondConnection.start).toHaveBeenCalledTimes(1);
  });
});
