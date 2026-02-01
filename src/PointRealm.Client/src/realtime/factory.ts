import { api } from '@/api/client';
import { getClientId } from '@/lib/storage';
import { getProfile, getRecentRealms } from '@/lib/storage/persistence';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { RealmRealtimeClient, RealmRealtimeClientOptions } from './realmClient';

export interface CreateRealmClientOptions
  extends Omit<RealmRealtimeClientOptions, 'refreshMemberToken' | 'clientId'> {
  clientId?: string;
}

function resolveDisplayName() {
  const stored = localStorage.getItem(STORAGE_KEYS.DISPLAY_NAME);
  if (stored && stored.trim()) return stored.trim();
  const profile = getProfile();
  return profile.lastDisplayName?.trim() || 'Wanderer';
}

function resolveRole(realmCode: string) {
  const recent = getRecentRealms().find(
    (item) => item.realmCode.toUpperCase() === realmCode.toUpperCase()
  );
  return recent?.role || 'participant';
}

export function createRealmClient(options: CreateRealmClientOptions = {}) {
  const clientId = options.clientId ?? getClientId();

  return new RealmRealtimeClient({
    ...options,
    clientId,
    refreshMemberToken: async ({ realmCode }) => {
      const displayName = resolveDisplayName();
      const role = resolveRole(realmCode);
      const response = await api.post<{
        memberToken?: string;
        memberId?: string;
      }>(`/v1/realms/${realmCode}/join`, {
        displayName,
        role,
      });

      if (response.memberToken) {
        sessionStorage.setItem(
          `pointrealm:v1:realm:${realmCode}:token`,
          response.memberToken
        );
      }
      if (response.memberId) {
        sessionStorage.setItem(
          `pointrealm:v1:realm:${realmCode}:memberId`,
          response.memberId
        );
      }
      return response.memberToken ?? null;
    },
  });
}
