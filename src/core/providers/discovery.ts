import type {
  AIConfigAppDefinition,
  AIModelDescriptor,
  AIModelDiscoveryCacheEntry,
  AIModelDiscoveryContext,
  AIProviderId,
  AIProviderRegistryOptions,
} from '../types/public';
import { getProviderById } from './registry';

const DISCOVERY_TTL_MS = 60 * 60 * 1000;
const DISCOVERY_STORAGE_PREFIX = 'evergray:ai-config:model-discovery:';

const memoryCache = new Map<string, AIModelDiscoveryCacheEntry>();
const inFlightRequests = new Map<string, Promise<AIModelDescriptor[]>>();

type OpenRouterModelResponse = {
  id?: string;
  name?: string;
  context_length?: number;
  pricing?: Record<string, unknown>;
};

type OpenAIModelResponse = {
  id?: string;
};

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function createCacheKey(provider: AIProviderId, hasApiKey: boolean): string {
  return `${provider}:api-key:${hasApiKey ? 'present' : 'absent'}`;
}

function createStorageKey(cacheKey: string): string {
  return `${DISCOVERY_STORAGE_PREFIX}${cacheKey}`;
}

function loadCachedEntry(cacheKey: string): AIModelDiscoveryCacheEntry | null {
  const memoryEntry = memoryCache.get(cacheKey);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    return memoryEntry;
  }

  if (!canUseLocalStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(createStorageKey(cacheKey));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AIModelDiscoveryCacheEntry;
    if (parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(createStorageKey(cacheKey));
      return null;
    }

    memoryCache.set(cacheKey, parsed);
    return parsed;
  } catch {
    window.localStorage.removeItem(createStorageKey(cacheKey));
    return null;
  }
}

function saveCachedEntry(cacheKey: string, models: AIModelDescriptor[]): AIModelDescriptor[] {
  const entry: AIModelDiscoveryCacheEntry = {
    models,
    discoveredAt: Date.now(),
    expiresAt: Date.now() + DISCOVERY_TTL_MS,
  };

  memoryCache.set(cacheKey, entry);

  if (canUseLocalStorage()) {
    window.localStorage.setItem(createStorageKey(cacheKey), JSON.stringify(entry));
  }

  return models;
}

function getCuratedModels(provider: AIProviderId): AIModelDescriptor[] {
  if (provider === 'anthropic') {
    return ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'].map(
      (id) => ({ id, label: id, provider }),
    );
  }

  if (provider === 'gemini') {
    return ['gemini-1.5-pro', 'gemini-1.5-flash'].map((id) => ({ id, label: id, provider }));
  }

  return [];
}

function filterOpenAIModel(id: string): boolean {
  return /gpt|o1|o3|o4/i.test(id);
}

async function fetchOpenRouterModels(signal?: AbortSignal): Promise<AIModelDescriptor[]> {
  const response = await fetch('https://openrouter.ai/api/v1/models', { signal });
  const payload = (await response.json().catch(() => null)) as {
    data?: OpenRouterModelResponse[];
  } | null;

  if (!response.ok || !payload?.data) {
    return [];
  }

  return payload.data
    .filter(
      (model): model is Required<Pick<OpenRouterModelResponse, 'id'>> & OpenRouterModelResponse =>
        typeof model.id === 'string' && model.id.length > 0,
    )
    .map((model) => ({
      id: model.id,
      label: model.name || model.id,
      provider: 'openrouter' as const,
      metadata: {
        contextLength: model.context_length,
        pricing: model.pricing,
        raw: model,
      },
    }));
}

async function fetchOpenAIModels(
  apiKey: string,
  signal?: AbortSignal,
): Promise<AIModelDescriptor[]> {
  const response = await fetch('https://api.openai.com/v1/models', {
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const payload = (await response.json().catch(() => null)) as {
    data?: OpenAIModelResponse[];
  } | null;

  if (!response.ok || !payload?.data) {
    return [];
  }

  return payload.data
    .filter(
      (model): model is Required<Pick<OpenAIModelResponse, 'id'>> & OpenAIModelResponse =>
        typeof model.id === 'string' && model.id.length > 0,
    )
    .filter((model) => filterOpenAIModel(model.id))
    .map((model) => ({
      id: model.id,
      label: model.id,
      provider: 'openai' as const,
      metadata: {
        raw: model,
      },
    }));
}

function applyModelFilter(
  models: AIModelDescriptor[],
  appDefinition?: AIConfigAppDefinition,
): AIModelDescriptor[] {
  return models
    .filter((model) => (appDefinition?.modelFilter ? appDefinition.modelFilter(model) : true))
    .sort((left, right) =>
      left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
    );
}

export function getDiscoveredModels(
  provider: AIProviderId,
  appDefinition?: AIConfigAppDefinition,
): AIModelDescriptor[] {
  const withKey = loadCachedEntry(createCacheKey(provider, true))?.models ?? [];
  const withoutKey = loadCachedEntry(createCacheKey(provider, false))?.models ?? [];
  const discovered = withKey.length > 0 ? withKey : withoutKey;

  return applyModelFilter(discovered, appDefinition);
}

export async function discoverAvailableModels(
  provider: AIProviderId,
  context: AIModelDiscoveryContext = {},
  appDefinition?: AIConfigAppDefinition,
  options?: AIProviderRegistryOptions,
): Promise<AIModelDescriptor[]> {
  const providerDefinition = getProviderById(provider, appDefinition, options);
  if (!providerDefinition) {
    return [];
  }

  const hasApiKey = Boolean(context.apiKey);
  const cacheKey = createCacheKey(provider, hasApiKey);

  if (!context.forceRefresh) {
    const cached = loadCachedEntry(cacheKey);
    if (cached) {
      return applyModelFilter(cached.models, appDefinition);
    }
  }

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) {
    return inFlight.then((models) => applyModelFilter(models, appDefinition));
  }

  const request = (async () => {
    try {
      let models: AIModelDescriptor[] = [];

      if (provider === 'openrouter') {
        models = await fetchOpenRouterModels(context.signal);
      } else if (provider === 'openai') {
        if (!context.apiKey) {
          return [];
        }
        models = await fetchOpenAIModels(context.apiKey, context.signal);
      } else if (provider === 'anthropic' || provider === 'gemini') {
        models = getCuratedModels(provider);
      }

      return saveCachedEntry(cacheKey, applyModelFilter(models, appDefinition));
    } catch {
      return applyModelFilter(loadCachedEntry(cacheKey)?.models ?? [], appDefinition);
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, request);
  return request;
}
