import { useState, useEffect, useCallback } from 'react';
import { hub } from '../realtime/hub';
import { RealmStateDto } from '../types/realm';
import { getClientId } from '../lib/storage';

interface UseRealmResult {
    state: RealmStateDto | null;
    loading: boolean;
    error: string | null;
    isConnected: boolean;
    actions: {
        joinRealm: (code: string) => Promise<void>;
        selectRune: (value: string) => Promise<void>;
        startEncounter: (questId: string) => Promise<void>;
        revealProphecy: () => Promise<void>;
        reRollFates: () => Promise<void>;
        sealOutcome: (value: number) => Promise<void>;
        addQuest: (title: string, description: string) => Promise<void>;
        updateQuest: (questId: string, title: string, description: string) => Promise<void>;
        deleteQuest: (questId: string) => Promise<void>;
        reorderQuests: (newOrderKeys: string[]) => Promise<void>;
        setDisplayName: (name: string) => Promise<void>;
    };
    connect: (code: string) => Promise<void>;
}

export function useRealm(realmCode?: string): UseRealmResult {
    const [state, setState] = useState<RealmStateDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(async (code: string) => {
        if (!code) return;
        
        const token = sessionStorage.getItem(`pointrealm:v1:realm:${code}:token`);
        if (!token) {
            setError("No access token found. Please join the realm first.");
            setLoading(false);
            return;
        }

        try {
            const clientId = getClientId();
            await hub.connect(token, clientId);
            setIsConnected(true);
            await hub.invoke('JoinRealm', code);
        } catch (err: any) {
            console.error("Failed to connect to realm:", err);
            setError(err.message || "Failed to connect to realm.");
            setIsConnected(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!realmCode) return;

        const handleStateUpdate = (data: RealmStateDto) => {
            console.log("Realm State Updated:", data);
            setState(data);
            setLoading(false);
        };

        hub.on('RealmStateUpdated', handleStateUpdate);

        connect(realmCode);

        return () => {
            hub.off('RealmStateUpdated', handleStateUpdate);
        };
    }, [realmCode, connect]);

    // Actions wrappers
    const wrapAction = async (actionName: string, ...args: any[]) => {
        try {
            await hub.invoke(actionName, ...args);
        } catch (err: any) {
            console.error(`Error invoking ${actionName}:`, err);
            // Optionally set error toast here
            throw err;
        }
    };

    return {
        state,
        loading,
        error,
        isConnected,
        actions: {
            joinRealm: connect,
            selectRune: (val) => wrapAction('SelectRune', val),
            startEncounter: (qId) => wrapAction('StartEncounter', qId),
            revealProphecy: () => wrapAction('RevealProphecy'),
            reRollFates: () => wrapAction('ReRollFates'),
            sealOutcome: (val) => wrapAction('SealOutcome', val),
            addQuest: (t, d) => wrapAction('AddQuest', t, d),
            updateQuest: (id, t, d) => wrapAction('UpdateQuest', id, t, d),
            deleteQuest: (id) => wrapAction('DeleteQuest', id),
            reorderQuests: (order) => wrapAction('ReorderQuests', order),
            setDisplayName: (name) => wrapAction('SetDisplayName', name),
        },
        connect
    };
}
