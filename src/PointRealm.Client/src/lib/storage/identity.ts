import { STORAGE_KEYS } from './keys';

// In-memory fallback if localStorage is disabled/fails
let memoryClientId: string | null = null;

export function getClientId(): string {
  try {
    let stored = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEYS.CLIENT_ID, stored);
    }
    return stored;
  } catch (e) {
    // Fallback to memory
    if (!memoryClientId) {
      memoryClientId = crypto.randomUUID();
    }
    return memoryClientId;
  }
}
