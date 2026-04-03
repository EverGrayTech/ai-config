import { describe, expect, it, vi } from 'vitest';

import {
  type AIConfigAppDefinition,
  type AIConfigState,
  type AIConfigStorageAdapter,
  clearAIConfig,
  clearAIConfigCredential,
  createAIConfigManager,
  createDefaultAIConfigState,
  createLocalStorageAIConfigStorageAdapter,
  loadAIConfig,
  mergeAIConfigWithAppDefinition,
  redactCredential,
  resetAIConfigState,
  sanitizeAIConfigForDebug,
  saveAIConfig,
  setAIConfigCategoryEnabled,
  setAIConfigCredential,
  setAIConfigMode,
  setAIConfigModel,
  setAIConfigProvider,
  setAIConfigRouteModel,
  setAIConfigRouteProvider,
  updateAIConfigGeneration,
  updateAIConfigRouteGeneration,
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
      selectedProvider: 'gemini',
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
    expect(() =>
      adapter.save({ schemaVersion: 1, state: createDefaultAIConfigState(appDefinition) }),
    ).not.toThrow();
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
    const savedPayloadRef: { current: { state: AIConfigState } | null } = { current: null };
    const storage: AIConfigStorageAdapter = {
      load: async () => null,
      save: async (payload) => {
        savedPayloadRef.current = { state: payload.state };
      },
      clear: async () => {
        savedPayloadRef.current = null;
      },
    };

    const manager = createAIConfigManager({
      appDefinition,
      storage,
    });

    manager.setMode('byok');
    manager.setProvider('openai');
    await manager.save();

    expect(savedPayloadRef.current).not.toBeNull();
    if (savedPayloadRef.current === null) {
      throw new Error('Expected saved state to be present');
    }
    const persistedState = savedPayloadRef.current.state;
    expect(persistedState.selectedProvider).toBe('openai');

    await manager.clearPersisted();
    expect(savedPayloadRef.current).toBeNull();
  });

  it('invokes hosted execution through the configured gateway client', async () => {
    const gateway = {
      authenticate: vi.fn().mockResolvedValue({ token: 'hosted-token' }),
      invoke: vi.fn().mockResolvedValue({
        provider: 'openai',
        model: 'gpt-4o-mini',
        output: 'Hosted output',
        usage: {
          inputTokens: 3,
          outputTokens: 12,
          totalTokens: 15,
        },
      }),
    };

    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway,
      },
    });

    const result = await manager.invoke({ input: 'Hello hosted world' });

    expect(gateway.authenticate).toHaveBeenCalledWith({
      appId: 'test-app',
      clientId: 'stable-client-id',
    });
    expect(gateway.invoke).toHaveBeenCalledWith({
      token: 'hosted-token',
      input: 'Hello hosted world',
      stream: undefined,
    });
    expect(result).toEqual({
      ok: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
      output: 'Hosted output',
      executionPath: 'hosted',
      providerLabel: 'OpenAI',
      modelLabel: undefined,
      usage: {
        inputTokens: 3,
        outputTokens: 12,
        totalTokens: 15,
      },
    });
  });

  it('invokes BYOK execution through the configured gateway client', async () => {
    const gateway = {
      authenticate: vi.fn().mockResolvedValue({ token: 'hosted-token' }),
      invoke: vi.fn().mockResolvedValue({
        provider: 'openai',
        model: 'gpt-4.1-mini',
        output: 'BYOK output',
      }),
    };

    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway,
      },
    });

    manager.setMode('byok');
    manager.setProvider('openai');
    manager.setModel('gpt-4.1-mini');
    manager.setCredential('openai', { apiKey: 'sk-test-1234567890' });

    const result = await manager.invoke({ input: 'Hello byok world' });

    expect(gateway.invoke).toHaveBeenCalledWith({
      token: 'hosted-token',
      provider: 'openai',
      model: 'gpt-4.1-mini',
      credential: 'sk-test-1234567890',
      input: 'Hello byok world',
      stream: undefined,
    });
    expect(result).toEqual({
      ok: true,
      provider: 'openai',
      model: 'gpt-4.1-mini',
      output: 'BYOK output',
      executionPath: 'byok-gateway',
      providerLabel: 'OpenAI',
      modelLabel: 'GPT-4.1 Mini',
      usage: undefined,
    });
  });

  it('returns a structured error when hosted execution is not configured', async () => {
    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
    });

    const result = await manager.invoke({ input: 'Hello hosted world' });

    expect(result).toEqual({
      ok: false,
      category: 'configuration',
      code: 'hosted-not-configured',
      message: 'Hosted gateway execution is not configured.',
      retryable: false,
    });
  });

  it('returns a structured error when BYOK execution has no gateway configured', async () => {
    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
    });

    manager.setMode('byok');
    manager.setProvider('openai');
    manager.setModel('gpt-4.1-mini');
    manager.setCredential('openai', { apiKey: 'sk-test-1234567890' });

    const result = await manager.invoke({ input: 'Hello byok world' });

    expect(result).toEqual({
      ok: false,
      category: 'configuration',
      code: 'hosted-not-configured',
      message: 'Hosted gateway execution is not configured.',
      retryable: false,
    });
  });

  it('returns a structured error when BYOK credentials are missing', async () => {
    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway: {
          authenticate: vi.fn(),
          invoke: vi.fn(),
        },
      },
    });

    manager.setMode('byok');
    manager.setProvider('openai');
    manager.setModel('gpt-4.1-mini');

    const result = await manager.invoke({ input: 'Hello byok world' });

    expect(result).toEqual({
      ok: false,
      category: 'configuration',
      code: 'missing-credential',
      message: 'Missing credential for provider "openai".',
      retryable: false,
    });
  });

  it('returns a structured hosted auth error when authentication fails', async () => {
    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway: {
          authenticate: vi.fn().mockRejectedValue(new Error('auth unavailable')),
          invoke: vi.fn(),
        },
      },
    });

    const result = await manager.invoke({ input: 'Hello hosted world' });

    expect(result).toEqual({
      ok: false,
      category: 'authentication',
      code: 'hosted-auth-failed',
      message: 'auth unavailable',
      retryable: true,
    });
  });

  it('returns a structured hosted invoke error when gateway execution fails', async () => {
    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway: {
          authenticate: vi.fn().mockResolvedValue({ token: 'hosted-token' }),
          invoke: vi.fn().mockRejectedValue(new Error('gateway unavailable')),
        },
      },
    });

    const result = await manager.invoke({ input: 'Hello hosted world' });

    expect(result).toEqual({
      ok: false,
      category: 'network',
      code: 'hosted-invoke-failed',
      message: 'gateway unavailable',
      retryable: true,
      upstream: undefined,
    });
  });

  it('preserves upstream hosted invoke policy errors and normalizes category/retryability', async () => {
    const error = new Error(
      'Requested model "gpt-4o-mini" is not allowed for this hosted route.',
    ) as Error & {
      status?: number;
      code?: string;
      category?: string;
      retryable?: boolean;
      details?: Record<string, string>;
    };

    error.status = 403;
    error.code = 'policy-model-not-allowed';
    error.category = 'policy';
    error.retryable = false;
    error.details = {
      model: 'gpt-4o-mini',
      reason: 'model_not_allowlisted',
    };

    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway: {
          authenticate: vi.fn().mockResolvedValue({ token: 'hosted-token' }),
          invoke: vi.fn().mockRejectedValue(error),
        },
      },
    });

    const result = await manager.invoke({ input: 'Hello hosted world' });

    expect(result).toEqual({
      ok: false,
      category: 'policy',
      code: 'hosted-invoke-failed',
      message: 'Requested model "gpt-4o-mini" is not allowed for this hosted route.',
      retryable: false,
      upstream: {
        status: 403,
        code: 'policy-model-not-allowed',
        category: 'policy',
        message: 'Requested model "gpt-4o-mini" is not allowed for this hosted route.',
        retryable: false,
        details: {
          model: 'gpt-4o-mini',
          reason: 'model_not_allowlisted',
        },
      },
    });
  });

  it('returns a structured hosted invoke error when BYOK gateway execution fails', async () => {
    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway: {
          authenticate: vi.fn().mockResolvedValue({ token: 'hosted-token' }),
          invoke: vi.fn().mockRejectedValue(new Error('provider unavailable')),
        },
      },
    });

    manager.setMode('byok');
    manager.setProvider('openai');
    manager.setModel('gpt-4.1-mini');
    manager.setCredential('openai', { apiKey: 'sk-test-1234567890' });

    const result = await manager.invoke({ input: 'Hello byok world' });

    expect(result).toEqual({
      ok: false,
      category: 'network',
      code: 'hosted-invoke-failed',
      message: 'provider unavailable',
      retryable: true,
      upstream: undefined,
    });
  });

  it('returns a structured token-expired error when refresh fails', async () => {
    const tokenExpiredError = new Error('token expired');
    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway: {
          authenticate: vi
            .fn()
            .mockResolvedValueOnce({ token: 'expired-token' })
            .mockRejectedValueOnce(new Error('refresh denied')),
          invoke: vi.fn().mockRejectedValue(tokenExpiredError),
        },
        shouldRefreshToken: (error) => error === tokenExpiredError,
      },
    });

    const result = await manager.invoke({ input: 'Hello hosted world' });

    expect(result).toEqual({
      ok: false,
      category: 'authentication',
      code: 'token-expired',
      message: 'refresh denied',
      retryable: true,
    });
  });

  it('refreshes the hosted token and retries once when configured to do so', async () => {
    const tokenExpiredError = new Error('token expired');
    const gateway = {
      authenticate: vi
        .fn()
        .mockResolvedValueOnce({ token: 'expired-token' })
        .mockResolvedValueOnce({ token: 'fresh-token' }),
      invoke: vi
        .fn()
        .mockRejectedValueOnce(tokenExpiredError)
        .mockResolvedValueOnce({
          provider: 'openai',
          model: 'gpt-4o-mini',
          output: 'Hosted output after refresh',
          usage: {
            inputTokens: 4,
            outputTokens: 16,
            totalTokens: 20,
          },
        }),
    };

    const manager = createAIConfigManager({
      appDefinition,
      storage: createMemoryStorage(),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway,
        shouldRefreshToken: (error) => error === tokenExpiredError,
      },
    });

    const result = await manager.invoke({ input: 'Hello hosted world' });

    expect(gateway.authenticate).toHaveBeenCalledTimes(2);
    expect(gateway.invoke).toHaveBeenNthCalledWith(1, {
      token: 'expired-token',
      input: 'Hello hosted world',
      stream: undefined,
    });
    expect(gateway.invoke).toHaveBeenNthCalledWith(2, {
      token: 'fresh-token',
      input: 'Hello hosted world',
      stream: undefined,
    });
    expect(result).toEqual({
      ok: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
      output: 'Hosted output after refresh',
      executionPath: 'hosted',
      providerLabel: 'OpenAI',
      modelLabel: undefined,
      usage: {
        inputTokens: 4,
        outputTokens: 16,
        totalTokens: 20,
      },
    });
  });

  it('creates disabled category routes for declared operation categories', () => {
    const categorizedState = createDefaultAIConfigState({
      ...appDefinition,
      operationCategories: [
        { key: 'evaluate', label: 'Evaluate' },
        { key: 'write', label: 'Write' },
      ],
    });

    expect(categorizedState.routes?.default.provider).toBe('hosted');
    expect(categorizedState.routes?.categories.evaluate).toEqual({
      enabled: false,
      provider: null,
      model: null,
      generation: {},
    });
    expect(categorizedState.routes?.categories.write).toEqual({
      enabled: false,
      provider: null,
      model: null,
      generation: {},
    });
  });

  it('rejects undeclared invocation categories as structured errors', async () => {
    const manager = createAIConfigManager({
      appDefinition: {
        ...appDefinition,
        operationCategories: [{ key: 'evaluate', label: 'Evaluate' }],
      },
      storage: createMemoryStorage(),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway: {
          authenticate: vi.fn(),
          invoke: vi.fn(),
        },
      },
    });

    const result = await manager.invoke({ input: 'Hello hosted world', category: 'write' });

    expect(result).toEqual({
      ok: false,
      category: 'configuration',
      code: 'invalid-category',
      message: 'Unknown AI operation category "write".',
      retryable: false,
      details: {
        category: 'write',
      },
    });
  });

  it('uses the default route when a declared category override is disabled', async () => {
    const gateway = {
      authenticate: vi.fn().mockResolvedValue({ token: 'hosted-token' }),
      invoke: vi.fn().mockResolvedValue({
        provider: 'openai',
        model: 'gpt-4o-mini',
        output: 'Hosted output',
      }),
    };

    const manager = createAIConfigManager({
      appDefinition: {
        ...appDefinition,
        operationCategories: [{ key: 'evaluate', label: 'Evaluate' }],
      },
      storage: createMemoryStorage(),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway,
      },
    });

    await manager.invoke({ input: 'Hello hosted world', category: 'evaluate' });

    expect(gateway.invoke).toHaveBeenCalledWith({
      token: 'hosted-token',
      input: 'Hello hosted world',
      stream: undefined,
    });
  });

  it('returns a structured error when an enabled category override has no provider', async () => {
    const categorizedAppDefinition: AIConfigAppDefinition = {
      ...appDefinition,
      operationCategories: [{ key: 'evaluate', label: 'Evaluate' }],
    };

    const manager = createAIConfigManager({
      appDefinition: categorizedAppDefinition,
      storage: createMemoryStorage({
        ...createDefaultAIConfigState(categorizedAppDefinition),
        mode: 'byok',
        routes: {
          default: {
            provider: 'openai',
            model: 'gpt-4.1-mini',
            generation: { ...appDefinition.defaultGeneration },
          },
          categories: {
            evaluate: {
              enabled: true,
              provider: null,
              model: null,
              generation: {},
            },
          },
        },
      }),
      hostedGateway: {
        clientId: 'stable-client-id',
        gateway: {
          authenticate: vi.fn().mockResolvedValue({ token: 'unused-token' }),
          invoke: vi.fn(),
        },
      },
    });

    const seededState = manager.getState();
    if (!seededState.routes) {
      throw new Error('Expected routes to be initialized');
    }
    seededState.routes.categories.evaluate.enabled = true;
    seededState.routes.categories.evaluate.provider = null;

    const result = await manager.invoke({ input: 'Hello hosted world', category: 'evaluate' });

    expect(result).toEqual({
      ok: false,
      category: 'configuration',
      code: 'missing-provider',
      message: 'AI category override "evaluate" is enabled but has no provider selected.',
      retryable: false,
      details: {
        category: 'evaluate',
      },
    });
  });

  it('supports category route state updates through headless actions', () => {
    const categorizedAppDefinition: AIConfigAppDefinition = {
      ...appDefinition,
      operationCategories: [{ key: 'evaluate', label: 'Evaluate' }],
    };

    let state = createDefaultAIConfigState(categorizedAppDefinition);
    state = setAIConfigCategoryEnabled(state, categorizedAppDefinition, 'evaluate', true);
    state = setAIConfigRouteProvider(state, categorizedAppDefinition, 'evaluate', 'openai');
    state = setAIConfigRouteModel(state, categorizedAppDefinition, 'evaluate', 'gpt-4.1-mini');
    state = updateAIConfigRouteGeneration(state, categorizedAppDefinition, 'evaluate', {
      temperature: 1.2,
      maxOutputTokens: 222,
    });

    expect(state.routes?.categories.evaluate).toEqual({
      enabled: true,
      provider: 'openai',
      model: 'gpt-4.1-mini',
      generation: {
        temperature: 1.2,
        maxOutputTokens: 222,
      },
    });
  });

  it('exposes category route actions through the manager', () => {
    const categorizedAppDefinition: AIConfigAppDefinition = {
      ...appDefinition,
      operationCategories: [{ key: 'evaluate', label: 'Evaluate' }],
    };

    const manager = createAIConfigManager({
      appDefinition: categorizedAppDefinition,
      storage: createMemoryStorage(),
    });

    manager.setCategoryEnabled('evaluate', true);
    manager.setRouteProvider('evaluate', 'openai');
    manager.setRouteModel('evaluate', 'gpt-4.1-mini');
    manager.updateRouteGeneration('evaluate', { reasoningPreset: 'high' });

    expect(manager.getState().routes?.categories.evaluate).toEqual({
      enabled: true,
      provider: 'openai',
      model: 'gpt-4.1-mini',
      generation: {
        temperature: 0.4,
        maxOutputTokens: 800,
        reasoningPreset: 'high',
      },
    });
  });

  it('uses default-route helpers when route action helpers receive the default route key', () => {
    const byokDefinition: AIConfigAppDefinition = {
      ...appDefinition,
      defaultMode: {
        enabled: false,
        label: 'Disabled default',
      },
      byok: {
        enabled: true,
        providers: ['openai', 'anthropic'],
      },
    };

    let state = createDefaultAIConfigState(byokDefinition);
    state = setAIConfigRouteProvider(state, byokDefinition, 'default', 'openai');
    state = setAIConfigRouteModel(state, byokDefinition, 'default', 'gpt-4.1-mini');
    state = updateAIConfigRouteGeneration(state, byokDefinition, 'default', {
      maxOutputTokens: 321,
    });

    expect(state.selectedProvider).toBe('openai');
    expect(state.selectedModel).toBe('gpt-4.1-mini');
    expect(state.generation.maxOutputTokens).toBe(321);
    expect(state.routes?.default).toEqual({
      provider: 'openai',
      model: 'gpt-4.1-mini',
      generation: {
        temperature: 0.4,
        maxOutputTokens: 321,
      },
    });
  });

  it('returns original state when category route helpers receive undeclared keys', () => {
    const categorizedAppDefinition: AIConfigAppDefinition = {
      ...appDefinition,
      operationCategories: [{ key: 'evaluate', label: 'Evaluate' }],
    };

    const state = createDefaultAIConfigState(categorizedAppDefinition);

    expect(setAIConfigRouteProvider(state, categorizedAppDefinition, 'write', 'openai')).toBe(
      state,
    );
    expect(setAIConfigRouteModel(state, categorizedAppDefinition, 'write', 'gpt-4.1-mini')).toBe(
      state,
    );
    expect(
      updateAIConfigRouteGeneration(state, categorizedAppDefinition, 'write', {
        temperature: 0.7,
      }),
    ).toBe(state);
    expect(setAIConfigCategoryEnabled(state, categorizedAppDefinition, 'write', true)).toBe(state);
  });

  it('returns original state when declared category route storage is unexpectedly missing', () => {
    const categorizedAppDefinition: AIConfigAppDefinition = {
      ...appDefinition,
      operationCategories: [{ key: 'evaluate', label: 'Evaluate' }],
    };

    const brokenState = {
      ...createDefaultAIConfigState(categorizedAppDefinition),
      routes: {
        default: {
          provider: 'hosted' as const,
          model: 'evergray-default',
          generation: { temperature: 0.4, maxOutputTokens: 800 },
        },
        categories: {},
      },
    } as AIConfigState;

    expect(
      setAIConfigRouteProvider(brokenState, categorizedAppDefinition, 'evaluate', 'openai'),
    ).toBe(brokenState);
    expect(
      setAIConfigRouteModel(brokenState, categorizedAppDefinition, 'evaluate', 'gpt-4.1-mini'),
    ).toBe(brokenState);
    expect(
      updateAIConfigRouteGeneration(brokenState, categorizedAppDefinition, 'evaluate', {
        temperature: 0.9,
      }),
    ).toBe(brokenState);
    expect(
      setAIConfigCategoryEnabled(brokenState, categorizedAppDefinition, 'evaluate', true),
    ).toBe(brokenState);
  });
});
