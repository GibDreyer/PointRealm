import { createContext, ReactNode, useContext, useEffect, useRef } from 'react';
import { createRealmClient } from '@/realtime';
import type { RealmRealtimeClient } from '@/realtime';
import { useRealmStore } from '@/state/realmStore';
import { useToast } from '@/components/ui/ToastSystem';

const RealmRealtimeContext = createContext<RealmRealtimeClient | null>(null);

export function useRealmClient() {
  const client = useContext(RealmRealtimeContext);
  if (!client) {
    throw new Error('useRealmClient must be used within RealtimeProvider');
  }
  return client;
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const clientRef = useRef<RealmRealtimeClient>(createRealmClient());

  const applyServerSnapshot = useRealmStore((state) => state.applyServerSnapshot);
  const applyServerEvent = useRealmStore((state) => state.applyServerEvent);
  const setConnectionStatus = useRealmStore((state) => state.setConnectionStatus);
  const setLastError = useRealmStore((state) => state.setLastError);

  useEffect(() => {
    const client = clientRef.current;

    const unsubscribers = [
      client.on('realmStateUpdated', (snapshot) => {
        applyServerSnapshot(snapshot);
      }),
      client.on('partyPresenceUpdated', (presence) => {
        applyServerEvent({ type: 'partyPresenceUpdated', payload: presence });
      }),
      client.on('encounterUpdated', (encounter) => {
        applyServerEvent({ type: 'encounterUpdated', payload: encounter });
      }),
      client.on('connectionStatusChanged', (status) => {
        setConnectionStatus(status);
        if (status === 'connected') {
          setLastError(undefined);
        }
      }),
      client.on('error', (error) => {
        setLastError({ code: error.code, message: error.message });
      }),
      client.on('toast', (message) => {
        toast(message, 'info');
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      client.disconnect().catch(() => undefined);
    };
  }, [applyServerEvent, applyServerSnapshot, setConnectionStatus, setLastError, toast]);

  return (
    <RealmRealtimeContext.Provider value={clientRef.current}>
      {children}
    </RealmRealtimeContext.Provider>
  );
}
