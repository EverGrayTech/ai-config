import type { AIConfigStorageAdapter, AIPersistedConfigPayload } from '../types/public';

const DEFAULT_STORAGE_KEY = 'evergray:ai-config';

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export class LocalStorageAIConfigStorageAdapter implements AIConfigStorageAdapter {
  private readonly storageKey: string;

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  load(): AIPersistedConfigPayload | null {
    if (!canUseLocalStorage()) {
      return null;
    }

    const raw = window.localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AIPersistedConfigPayload;
    } catch {
      return null;
    }
  }

  save(payload: AIPersistedConfigPayload): void {
    if (!canUseLocalStorage()) {
      return;
    }

    window.localStorage.setItem(this.storageKey, JSON.stringify(payload));
  }

  clear(): void {
    if (!canUseLocalStorage()) {
      return;
    }

    window.localStorage.removeItem(this.storageKey);
  }
}

export function createLocalStorageAIConfigStorageAdapter(
  storageKey?: string,
): AIConfigStorageAdapter {
  return new LocalStorageAIConfigStorageAdapter(storageKey);
}
