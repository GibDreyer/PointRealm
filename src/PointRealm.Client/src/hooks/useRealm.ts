import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealmStore } from '@/state/realmStore';
import { useRealmClient } from '@/app/providers/RealtimeProvider';
import { getClientId } from '@/lib/storage';
import type { RealmStateDto } from '@/types/realm';
import type { ConnectionStatus } from '@/realtime';

interface UseRealmResult {
  state: RealmStateDto | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  actions: {
    joinRealm: (code: string) => Promise<void>;
    selectRune: (value: string) => Promise<void>;
    startEncounter: (questId: string) => Promise<void>;
    revealProphecy: () => Promise<void>;
    reRollFates: () => Promise<void>;
    sealOutcome: (value: number) => Promise<void>;
    addQuest: (title: string, description: string) => Promise<void>;
    updateQuest: (
      questId: string,
      title: string,
      description: string
    ) => Promise<void>;
    deleteQuest: (questId: string) => Promise<void>;
    reorderQuests: (newOrderKeys: string[]) => Promise<void>;
    setDisplayName: (name: string) => Promise<void>;
  };
  connect: (code: string) => Promise<void>;
}

export function useRealm(realmCode?: string): UseRealmResult {
  const navigate = useNavigate();
  const client = useRealmClient();
  const state = useRealmStore((s) => s.realmSnapshot ?? null);
  const connectionStatus = useRealmStore((s) => s.connectionStatus);
  const lastError = useRealmStore((s) => s.lastError);
  const setLastError = useRealmStore((s) => s.setLastError);
  const setConnectionStatus = useRealmStore((s) => s.setConnectionStatus);

  const connect = useCallback(
    async (code: string) => {
      if (!code) return;

      const token = sessionStorage.getItem(`pointrealm:v1:realm:${code}:token`);
      if (!token) {
        setLastError({
          code: 'auth/token_missing',
          message: 'No access token found. Please join the realm first.',
        });
        setConnectionStatus('error');
        navigate(`/join?realmCode=${code}`);
        return;
      }

      try {
        const clientId = getClientId();
        await client.connect({ realmCode: code, memberToken: token, clientId });
      } catch (err: any) {
        setLastError({
          code: 'connection_failed',
          message: err?.message || 'Failed to connect to realm.',
        });
        setConnectionStatus('error');
      }
    },
    [client, navigate, setConnectionStatus, setLastError]
  );

  useEffect(() => {
    if (!realmCode) return;
    connect(realmCode);
    return () => {
      client.disconnect().catch(() => undefined);
    };
  }, [realmCode, connect, client]);

  useEffect(() => {
    if (!realmCode) return;
    if (lastError?.code === 'auth_refresh_failed') {
      navigate(`/join?realmCode=${realmCode}`);
    }
  }, [lastError?.code, navigate, realmCode]);

  const wrapAction = async (actionName: string, ...args: any[]) => {
    if (connectionStatus !== 'connected') {
      setLastError({
        code: 'connection_unavailable',
        message: 'Connection lost. Actions are paused until reconnection.',
      });
      return;
    }
    try {
      const method = actionName as keyof typeof client;
      const handler = (client as Record<string, (...a: any[]) => Promise<void>>)[
        method
      ];
      if (handler) {
        await handler(...args);
      }
    } catch (err: any) {
      setLastError({
        code: 'action_failed',
        message: err?.message || `Failed to invoke ${actionName}.`,
      });
      throw err;
    }
  };

  return {
    state,
    loading:
      connectionStatus === 'connecting' || (!state && connectionStatus !== 'error'),
    error: lastError?.message || null,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    actions: {
      joinRealm: connect,
      selectRune: (val) => wrapAction('selectRune', val),
      startEncounter: (qId) => wrapAction('startEncounter', qId),
      revealProphecy: () => wrapAction('revealProphecy'),
      reRollFates: () => wrapAction('reRollFates'),
      sealOutcome: (val) => wrapAction('sealOutcome', val),
      addQuest: (t, d) => wrapAction('addQuest', t, d),
      updateQuest: (id, t, d) => wrapAction('updateQuest', id, t, d),
      deleteQuest: (id) => wrapAction('deleteQuest', id),
      reorderQuests: (order) => wrapAction('reorderQuests', order),
      setDisplayName: (name) => wrapAction('setDisplayName', name),
    },
    connect,
  };
}
