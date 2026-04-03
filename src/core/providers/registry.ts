import type {
  AIConfigAppDefinition,
  AIModelDescriptor,
  AIProviderDefinition,
  AIProviderId,
  AIProviderRegistryOptions,
} from '../types/public';
import { builtInProviders } from './builtins';
import { getDiscoveredModels } from './discovery';

function mergeProviderDefinition(
  provider: AIProviderDefinition,
  override?: Partial<AIProviderDefinition>,
): AIProviderDefinition {
  return {
    ...provider,
    ...override,
    models: override?.models ?? provider.models,
  };
}

export function createProviderRegistry(
  options: AIProviderRegistryOptions = {},
): AIProviderDefinition[] {
  const baseProviders = options.providers ?? builtInProviders;

  return baseProviders.map((provider) =>
    mergeProviderDefinition(provider, options.overrides?.[provider.id]),
  );
}

export function getProviderMap(
  options?: AIProviderRegistryOptions,
): Record<string, AIProviderDefinition> {
  return Object.fromEntries(
    createProviderRegistry(options).map((provider) => [provider.id, provider]),
  );
}

export function getAvailableProviders(
  appDefinition?: AIConfigAppDefinition,
  options?: AIProviderRegistryOptions,
): AIProviderDefinition[] {
  const registry = createProviderRegistry({
    ...options,
    overrides: {
      ...options?.overrides,
      ...appDefinition?.providerOverrides,
    },
  });

  const enabledProviders = new Set<AIProviderId>();

  if (appDefinition?.defaultMode?.provider) {
    enabledProviders.add(appDefinition.defaultMode.provider);
  }

  for (const provider of appDefinition?.byok?.providers ?? []) {
    enabledProviders.add(provider);
  }

  const filtered = enabledProviders.size
    ? registry.filter((provider) => enabledProviders.has(provider.id))
    : registry;

  const order = appDefinition?.providerOrder;
  if (!order?.length) {
    return filtered;
  }

  return [...filtered].sort((left, right) => {
    const leftIndex = order.indexOf(left.id);
    const rightIndex = order.indexOf(right.id);

    const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    return normalizedLeft - normalizedRight;
  });
}

export function getProviderById(
  providerId: AIProviderId,
  appDefinition?: AIConfigAppDefinition,
  options?: AIProviderRegistryOptions,
): AIProviderDefinition | undefined {
  return getAvailableProviders(appDefinition, options).find(
    (provider) => provider.id === providerId,
  );
}

export function getAvailableModels(
  providerId: AIProviderId,
  appDefinition?: AIConfigAppDefinition,
  options?: AIProviderRegistryOptions,
): AIModelDescriptor[] {
  const discoveredModels = getDiscoveredModels(providerId, appDefinition);
  if (discoveredModels.length > 0) {
    return discoveredModels;
  }

  const provider = getProviderById(providerId, appDefinition, options);

  if (!provider) {
    return [];
  }

  return provider.models.filter((model) => {
    if (model.disabled) {
      return false;
    }

    return appDefinition?.modelFilter ? appDefinition.modelFilter(model) : true;
  });
}

export function getModelById(
  providerId: AIProviderId,
  modelId: string,
  appDefinition?: AIConfigAppDefinition,
  options?: AIProviderRegistryOptions,
): AIModelDescriptor | undefined {
  return getAvailableModels(providerId, appDefinition, options).find(
    (model) => model.id === modelId,
  );
}
