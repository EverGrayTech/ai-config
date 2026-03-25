import { describe, expect, it } from 'vitest';

import {
  builtInProviders,
  createProviderRegistry,
  getAIUsagePresentation,
  getAvailableModels,
  getAvailableProviders,
  getModelById,
  getModelCostWarning,
  getProviderById,
  isAppProvidedMode,
  validateCredential,
  type AIConfigAppDefinition,
} from '../../src';

describe('provider registry and validation', () => {
  const appDefinition: AIConfigAppDefinition = {
    appId: 'provider-test-app',
    defaultMode: {
      enabled: true,
      label: 'Hosted default',
      provider: 'hosted',
      model: 'hosted-model',
      usageHint: 'Hosted usage applies.',
    },
    byok: {
      enabled: true,
      providers: ['anthropic', 'openai'],
    },
    providerOrder: ['anthropic', 'openai'],
    usagePresentation: {
      freeTierHint: 'Free requests are limited.',
    },
    modelFilter: (model) => model.id !== 'gpt-4.1',
  };

  it('exposes built-in providers', () => {
    expect(builtInProviders.length).toBeGreaterThanOrEqual(4);
    expect(builtInProviders.some((provider) => provider.id === 'openai')).toBe(true);
  });

  it('creates registry with provider overrides', () => {
    const registry = createProviderRegistry({
      overrides: {
        openai: {
          label: 'OpenAI Custom',
        },
      },
    });

    expect(registry.find((provider) => provider.id === 'openai')?.label).toBe('OpenAI Custom');
  });

  it('supports custom provider registries', () => {
    const registry = createProviderRegistry({
      providers: [
        {
          id: 'custom',
          label: 'Custom Provider',
          credentialLabel: 'Custom key',
          supportsBYOK: true,
          models: [],
        },
      ],
    });

    expect(registry).toHaveLength(1);
    expect(registry[0]?.id).toBe('custom');
  });

  it('returns available providers in app-defined order', () => {
    const providers = getAvailableProviders(appDefinition);

    expect(providers.map((provider) => provider.id)).toEqual(['anthropic', 'openai']);
  });

  it('finds providers by id', () => {
    const provider = getProviderById('openai', appDefinition);

    expect(provider?.label).toBe('OpenAI');
  });

  it('returns undefined for unavailable provider ids', () => {
    expect(getProviderById('google', appDefinition)).toBeUndefined();
  });

  it('filters available models using app definition', () => {
    const models = getAvailableModels('openai', appDefinition);

    expect(models.some((model) => model.id === 'gpt-4.1')).toBe(false);
    expect(models.some((model) => model.id === 'gpt-4.1-mini')).toBe(true);
  });

  it('returns model metadata by id', () => {
    const model = getModelById('anthropic', 'claude-3-7-sonnet', appDefinition);

    expect(model?.provider).toBe('anthropic');
    expect(model?.costHint).toBe('high');
  });

  it('returns undefined for unknown models', () => {
    expect(getModelById('anthropic', 'missing-model', appDefinition)).toBeUndefined();
  });

  it('returns no models for unavailable providers', () => {
    expect(getAvailableModels('google', appDefinition)).toEqual([]);
  });

  it('returns default usage presentation for app-provided mode', () => {
    const usage = getAIUsagePresentation(
      {
        mode: 'default',
        selectedProvider: 'hosted',
        selectedModel: 'hosted-model',
        credentials: {},
        generation: {},
      },
      appDefinition,
    );

    expect(usage.modeLabel).toBe('Hosted default');
    expect(usage.usageHint).toBe('Hosted usage applies.');
  });

  it('returns byok usage presentation when not in default mode', () => {
    const usage = getAIUsagePresentation(
      {
        mode: 'byok',
        selectedProvider: 'openai',
        selectedModel: 'gpt-4.1-mini',
        credentials: {},
        generation: {},
      },
      appDefinition,
    );

    expect(usage.modeLabel).toBeDefined();
    expect(usage.costHint).toContain('Costs depend');
  });

  it('returns no warning for low-cost and missing-cost models', () => {
    const lowCostModel = getModelById('openai', 'gpt-4.1-mini', appDefinition);

    expect(getModelCostWarning(lowCostModel)).toContain('cost more');
    expect(getModelCostWarning(undefined)).toBeUndefined();
  });

  it('provides high-cost warnings when model metadata indicates it', () => {
    const model = getModelById('anthropic', 'claude-3-7-sonnet', appDefinition);

    expect(getModelCostWarning(model)).toContain('higher usage cost');
  });

  it('identifies default mode as app-provided', () => {
    expect(isAppProvidedMode('default')).toBe(true);
    expect(isAppProvidedMode('byok')).toBe(false);
  });

  it('returns error validation result for unknown providers', async () => {
    const result = await validateCredential('custom', 'test-key', appDefinition);

    expect(result.ok).toBe(false);
    expect(result.status).toBe('error');
  });

  it('uses provider-level validation when configured via overrides', async () => {
    const result = await validateCredential(
      'openai',
      'sk-valid-123',
      {
        ...appDefinition,
        providerOverrides: {
          openai: {
            validateCredential: async ({ apiKey }) => ({
              ok: apiKey.startsWith('sk-valid'),
              status: apiKey.startsWith('sk-valid') ? 'valid' : 'invalid',
              message: 'Validated by override.',
              validatedAt: '2026-03-25T00:00:00.000Z',
            }),
          },
        },
      },
    );

    expect(result.ok).toBe(true);
    expect(result.status).toBe('valid');
  });

  it('returns error result when validation is not configured', async () => {
    const result = await validateCredential('anthropic', 'sk-ant-test', appDefinition);

    expect(result.ok).toBe(false);
    expect(result.message).toContain('not configured');
  });

  it('supports validation through registry option overrides', async () => {
    const result = await validateCredential(
      'openai',
      'AIza-valid-key',
      appDefinition,
      {
        overrides: {
          openai: {
            validateCredential: async ({ apiKey }) => ({
              ok: apiKey.startsWith('AIza'),
              status: apiKey.startsWith('AIza') ? 'valid' : 'invalid',
              message: 'Validated via registry override.',
              validatedAt: '2026-03-25T00:00:00.000Z',
            }),
          },
        },
      },
    );

    expect(result.ok).toBe(true);
    expect(result.message).toContain('registry override');
  });
});
