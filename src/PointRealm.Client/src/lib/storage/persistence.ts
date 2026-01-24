import { z } from 'zod';
import { STORAGE_KEYS } from './keys';
import { ProfileSchema, RecentRealmsSchema, Profile, RecentRealms, RecentRealmItem } from './schemas';

// Helpers
function safeRead<T>(key: string, schema: z.ZodType<T>, defaultValue: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return defaultValue;
        const parsed = JSON.parse(raw);
        const result = schema.safeParse(parsed);
        if (result.success) return result.data;
        // If invalid, reset
        console.warn(`Invalid data for ${key}, resetting.`);
        return defaultValue;
    } catch {
        return defaultValue;
    }
}

function safeWrite<T>(key: string, value: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Failed to write to localStorage', e);
    }
}

// Profile
const DEFAULT_PROFILE: Profile = {
    schemaVersion: 1,
    lastDisplayName: '',
    updatedAt: new Date().toISOString(), // Will be overwritten on save, but needed for type match
};

export function getProfile(): Profile {
    return safeRead(STORAGE_KEYS.PROFILE, ProfileSchema, DEFAULT_PROFILE);
}

export function updateProfile(updates: Partial<Omit<Profile, 'schemaVersion' | 'updatedAt'>>): void {
    const current = getProfile();
    const next: Profile = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    safeWrite(STORAGE_KEYS.PROFILE, next);
}

// Recent Realms
const DEFAULT_RECENT_REALMS: RecentRealms = {
    schemaVersion: 1,
    items: [],
};

const MAX_RECENT_REALMS = 10;

function normalizeRealmCode(code: string): string {
    return code.trim().toUpperCase();
}

export function getRecentRealms(): RecentRealmItem[] {
    const data = safeRead(STORAGE_KEYS.RECENT_REALMS, RecentRealmsSchema, DEFAULT_RECENT_REALMS);
    return data.items.sort((a, b) => new Date(b.lastVisitedAt).getTime() - new Date(a.lastVisitedAt).getTime());
}

export function addOrUpdateRecentRealm(item: Omit<RecentRealmItem, 'lastVisitedAt'>): void {
    const data = safeRead(STORAGE_KEYS.RECENT_REALMS, RecentRealmsSchema, DEFAULT_RECENT_REALMS);
    const normalizedCode = normalizeRealmCode(item.realmCode);
    
    // Remove existing if present (to re-add at top or update)
    let items = data.items.filter(i => normalizeRealmCode(i.realmCode) !== normalizedCode);
    
    // Create new item
    const newItem: RecentRealmItem = {
        ...item,
        realmCode: normalizedCode,
        lastVisitedAt: new Date().toISOString(),
    };

    // Prepend
    items.unshift(newItem);
    
    // Limit
    items = items.slice(0, MAX_RECENT_REALMS);
    
    safeWrite(STORAGE_KEYS.RECENT_REALMS, { ...data, items });
}

export function removeRecentRealm(realmCode: string): void {
    const data = safeRead(STORAGE_KEYS.RECENT_REALMS, RecentRealmsSchema, DEFAULT_RECENT_REALMS);
    const normalizedCode = normalizeRealmCode(realmCode);
    const items = data.items.filter(i => normalizeRealmCode(i.realmCode) !== normalizedCode);
    safeWrite(STORAGE_KEYS.RECENT_REALMS, { ...data, items });
}

export function clearRecentRealms(): void {
    safeWrite(STORAGE_KEYS.RECENT_REALMS, DEFAULT_RECENT_REALMS);
}
