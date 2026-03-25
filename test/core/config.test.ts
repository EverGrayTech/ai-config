import { describe, expect, it, vi } from 'vitest';

import {
  clearAIConfig,
  clearAIConfigCredential,
  createAIConfigManager,
  createLocalStorageAIConfigStorageAdapter,
  createDefaultAIConfigState,
  loadAIConfig,
  mergeAIConfigWithAppDefinition,
  redactCredential,
  resetAIConfigState,
  sanitizeAIConfigForDebug,
  saveAIConfig,
  setAIConfigModel,
  setAIConfigCredential,
  setAIConfigMode,
  setAIConfigProvider,
  updateAIConfigGeneration,
  type AIConfigAppDefinition,
  type AIConfigState,
  type AIConfigStorageAdapter,
} from '../../src';

const appDefinition: AIConfigAppDefinition = {
  appId: 'test-app',
  storageKey: 'test-ai-config',
  defaultMode: {
    enabled: true,
    label: 'App default',
    provider: 'hosted',
    model: 'evergray-default',
  },
  byok: {
    enabled: true,
    providers: ['openai', 'anthropic'],
  },
  defaultGeneration: {
    temperature: 0.4,
    maxOutputTokens: 800,
  },
  usagePresentation: {
    modeLabel: 'Default',
  },
};

function createMemoryStorage(
  initialState?: AIConfigState,
): AIConfigStorageAdapter & { saved: AIConfigState | null } {
  let payload = initialState ? { schemaVersion: 1, state: initialState } : null;

  return {
    saved: initialState ?? null,
    load() {
      return payload;
    },
    save(nextPayload) {
      payload = nextPayload;
      this.saved = nextPayload.state;
    },
    clear() {
      payload = null;
      this.saved = null;
    },
  };
}

describe('headless foundation', () => {
  it('creates default config state from app definition', () => {
    const state = createDefaultAIConfigState(appDefinition);

    expect(state.mode).toBe('default');
    expect(state.selectedProvider).toBe('hosted');
    expect(state.selectedModel).toBe('evergray-default');
    expect(state.generation.temperature).toBe(0.4);
  });

  it('merges persisted state over app defaults deterministically', () => {
    const state = mergeAIConfigWithAppDefinition(appDefinition, {
      mode: 'byok',
      selectedProvider: 'openai',
      selectedModel: 'gpt-4.1-mini',
      generation: {
        temperature: 0.8,
      },
    });

    expect(state.mode).toBe('byok');
    expect(state.selectedProvider).toBe('openai');
    expect(state.selectedModel).toBe('gpt-4.1-mini');
    expect(state.generation.temperature).toBe(0.8);
    expect(state.generation.maxOutputTokens).toBe(800);
  });

  it('normalizes invalid providers safely', () => {
    const state = mergeAIConfigWithAppDefinition(appDefinition, {
      mode: 'byok',
      selectedProvider: 'google',
    });

    expect(state.selectedProvider).toBeNull();
  });

  it('falls back to byok when default mode is disabled', () => {
    const state = createDefaultAIConfigState({
      appId: 'byok-only-app',
      defaultMode: {
        enabled: false,
        label: 'Disabled',
      },
      byok: {
        enabled: true,
        providers: ['openai'],
      },
    });

    expect(state.mode).toBe('byok');
  });

  it('forces default mode when byok is disabled', () => {
    const state = mergeAIConfigWithAppDefinition(
      {
        appId: 'default-only-app',
        defaultMode: {
          enabled: true,
          label: 'App default',
          provider: 'hosted',
          model: 'evergray-default',
        },
        byok: {
          enabled: false,
          providers: ['openai'],
        },
      },
      {
        mode: 'byok',
        selectedProvider: 'openai',
      },
    );

    expect(state.mode).toBe('default');
    expect(state.selectedProvider).toBe('hosted');
  });

  it('falls back to default mode when requested default is allowed by implicit config', () => {
    const state = mergeAIConfigWithAppDefinition(
      {
        appId: 'implicit-default-app',
      },
      {
        mode: 'default',
      },
    );

    expect(state.mode).toBe('default');
  });

  it('supports mode, provider, credential, and generation updates', () => {
    let state = createDefaultAIConfigState(appDefinition);
    state = setAIConfigMode(state, appDefinition, 'byok');
    state = setAIConfigProvider(state, appDefinition, 'openai');
    state = setAIConfigCredential(state, 'openai', { apiKey: 'sk-test-1234567890' });
    state = updateAIConfigGeneration(state, { temperature: 0.9 });

    expect(state.mode).toBe('byok');
    expect(state.selectedProvider).toBe('openai');
    expect(state.credentials.openai.isPresent).toBe(true);
    expect(state.generation.temperature).toBe(0.9);
  });

  it('supports model updates and reset to defaults', () => {
    let state = createDefaultAIConfigState(appDefinition);
    state = setAIConfigMode(state, appDefinition, 'byok');
    state = setAIConfigProvider(state, appDefinition, 'openai');
    state = setAIConfigModel(state, appDefinition, 'gpt-4.1-mini');

    expect(state.selectedModel).toBe('gpt-4.1-mini');

    const resetState = resetAIConfigState(appDefinition);

    expect(resetState.mode).toBe('default');
    expect(resetState.selectedModel).toBe('evergray-default');
  });

  it('preserves selected model when provider does not change', () => {
    let state = createDefaultAIConfigState(appDefinition);
    state = setAIConfigMode(state, appDefinition, 'byok');
    state = setAIConfigProvider(state, appDefinition, 'openai');
    state = setAIConfigModel(state, appDefinition, 'gpt-4.1-mini');
    state = setAIConfigProvider(state, appDefinition, 'openai');

    expect(state.selectedModel).toBe('gpt-4.1-mini');
  });

  it('persists and loads state through storage adapter', async () => {
    const storage = createMemoryStorage();
    const state = mergeAIConfigWithAppDefinition(appDefinition, {
      mode: 'byok',
      selectedProvider: 'anthropic',
      selectedModel: 'claude-3-7-sonnet',
    });

    await saveAIConfig(storage, state);
    const loaded = await loadAIConfig(storage, appDefinition);

    expect(loaded.selectedProvider).toBe('anthropic');
    expect(loaded.selectedModel).toBe('claude-3-7-sonnet');
  });

  it('recovers from corrupted persisted state', async () => {
    const storage: AIConfigStorageAdapter = {
      load: vi.fn().mockReturnValue({ bad: true }),
      save: vi.fn(),
      clear: vi.fn(),
    };

    const loaded = await loadAIConfig(storage, appDefinition);

    expect(loaded.mode).toBe('default');
    expect(loaded.selectedProvider).toBe('hosted');
  });

  it('supports manager subscription and reset flows', async () => {
    const storage = createMemoryStorage();
    const manager = createAIConfigManager({
      appDefinition,
      storage,
    });

    const listener = vi.fn();
    const unsubscribe = manager.subscribe(listener);

    manager.setMode('byok');
    manager.setProvider('openai');
    manager.setCredential('openai', { apiKey: 'sk-test-1234567890' });
    await manager.save();
    await manager.clearPersisted();

    expect(listener).toHaveBeenCalled();
    expect(storage.saved).toBeNull();
    expect(manager.getState().mode).toBe('default');

    unsubscribe();
  });

  it('supports manager load and direct reset flows', async () => {
    const storage = createMemoryStorage(
      mergeAIConfigWithAppDefinition(appDefinition, {
        mode: 'byok',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4.1-mini',
      }),
    );

    const manager = createAIConfigManager({
      appDefinition,
      storage,
    });

    await manager.load();
    expect(manager.getState().selectedProvider).toBe('openai');

    manager.reset();
    expect(manager.getState().selectedProvider).toBe('hosted');
  });

  it('supports manager model and credential clearing actions', () => {
    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
    });

    manager.setMode('byok');
    manager.setProvider('openai');
    manager.setModel('gpt-4.1-mini');
    manager.setCredential('openai', { apiKey: 'sk-test-1234567890' });

    expect(manager.getState().selectedModel).toBe('gpt-4.1-mini');
    expect(manager.getState().credentials.openai.isPresent).toBe(true);

    manager.clearCredential('openai');

    expect(manager.getState().credentials.openai).toBeUndefined();
  });

  it('redacts and sanitizes credentials for debug output', () => {
    const state = setAIConfigCredential(createDefaultAIConfigState(appDefinition), 'openai', {
      apiKey: 'sk-test-1234567890',
      label: 'Personal key',
    });

    expect(redactCredential('sk-test-1234567890')).toBe('sk-t••••7890');
    expect(sanitizeAIConfigForDebug(state).credentials.openai.apiKey).toBe('sk-t••••7890');
  });

  it('handles empty and short credential redaction cases', () => {
    expect(redactCredential()).toBeUndefined();
    expect(redactCredential('short')).toBe('••••');
  });

  it('clears persisted storage explicitly', async () => {
    const storage = createMemoryStorage(createDefaultAIConfigState(appDefinition));

    await clearAIConfig(storage);

    expect(storage.saved).toBeNull();
  });

  it('clears individual credentials without affecting others', () => {
    let state = createDefaultAIConfigState(appDefinition);
    state = setAIConfigCredential(state, 'openai', { apiKey: 'sk-openai-1234567890' });
    state = setAIConfigCredential(state, 'anthropic', { apiKey: 'sk-anthropic-1234567890' });
    state = clearAIConfigCredential(state, 'openai');

    expect(state.credentials.openai).toBeUndefined();
    expect(state.credentials.anthropic.isPresent).toBe(true);
  });

  it('supports async storage adapters', async () => {
    const state = mergeAIConfigWithAppDefinition(appDefinition, {
      mode: 'byok',
      selectedProvider: 'openai',
    });

    const storage: AIConfigStorageAdapter = {
      load: async () => ({ schemaVersion: 1, state }),
      save: async () => undefined,
      clear: async () => undefined,
    };

    const loaded = await loadAIConfig(storage, appDefinition);

    expect(loaded.selectedProvider).toBe('openai');
  });

  it('uses SSR-safe local storage adapter behavior', () => {
    const adapter = createLocalStorageAIConfigStorageAdapter('ssr-test-key');

    expect(adapter.load()).toBeNull();
    expect(() => adapter.save({ schemaVersion: 1, state: createDefaultAIConfigState(appDefinition) })).not.toThrow();
    expect(() => adapter.clear()).not.toThrow();
  });

  it('parses browser local storage payloads when available', () => {
    const store = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };

    vi.stubGlobal('window', {
      localStorage: localStorageMock,
    });

    const adapter = createLocalStorageAIConfigStorageAdapter('browser-test-key');
    const state = createDefaultAIConfigState(appDefinition);

    adapter.save({ schemaVersion: 1, state });
    expect(adapter.load()).toEqual({ schemaVersion: 1, state });

    adapter.clear();
    expect(adapter.load()).toBeNull();

    vi.unstubAllGlobals();
  });

  it('returns null for invalid browser local storage payloads', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => '{invalid-json',
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
    });

    const adapter = createLocalStorageAIConfigStorageAdapter('invalid-browser-test-key');

    expect(adapter.load()).toBeNull();

    vi.unstubAllGlobals();
  });

  it('returns default state for schema mismatches', async () => {
    const storage: AIConfigStorageAdapter = {
      load: () => ({
        schemaVersion: 999,
        state: mergeAIConfigWithAppDefinition(appDefinition, {
          mode: 'byok',
          selectedProvider: 'openai',
        }),
      }),
      save: vi.fn(),
      clear: vi.fn(),
    };

    const loaded = await loadAIConfig(storage, appDefinition);

    expect(loaded.mode).toBe('default');
    expect(loaded.selectedProvider).toBe('hosted');
  });

  it('supports async manager persistence methods', async () => {
    let savedPayload: { state: AIConfigState } | null = null;
    const storage: AIConfigStorageAdapter = {
      load: async () => null,
      save: async (payload) => {
        savedPayload = { state: payload.state };
      },
      clear: async () => {
        savedPayload = null;
      },
    };

    const manager = createAIConfigManager({
      appDefinition,
      storage,
    });

    manager.setMode('byok');
    manager.setProvider('openai');
    await manager.save();

    expect(savedPayload).not.toBeNull();
    if (!savedPayload) {
      throw new Error('Expected saved state to be present');
    }
    expect(savedPayload.state.selectedProvider).toBe('openai');

    await manager.clearPersisted();
    expect(savedPayload).toBeNull();
  });
});
