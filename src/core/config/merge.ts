import { getAvailableModels } from '../providers/registry';
import type {
  AIConfigAppDefinition,
  AIConfigCategoryRouteSettings,
  AIConfigMode,
  AIConfigRouteSettings,
  AIConfigState,
  AIProviderId,
} from '../types/public';
import { createDefaultAIConfigState } from './defaults';

function getCategoryKeys(appDefinition: AIConfigAppDefinition): Set<string> {
  return new Set((appDefinition.operationCategories ?? []).map((category) => category.key));
}

function normalizeRouteSettings(
  route: AIConfigRouteSettings,
  appDefinition: AIConfigAppDefinition,
  options?: {
    fallbackProvider?: AIProviderId | null;
    fallbackModel?: string | null;
    forceProvider?: AIProviderId | null;
    forceModel?: string | null;
  },
): AIConfigRouteSettings {
  const allowedProviders = getAllowedProviders(appDefinition);

  let provider = options?.forceProvider ?? route.provider;
  if (provider && !allowedProviders.has(provider)) {
    provider = options?.fallbackProvider ?? null;
  }

  let model = options?.forceModel ?? route.model;
  if (provider && model) {
    const modelStillAvailable = getAvailableModels(provider, appDefinition).some(
      (availableModel) => availableModel.id === model,
    );

    if (!modelStillAvailable) {
      model = options?.fallbackModel ?? null;
    }
  }

  return {
    provider,
    model,
    generation: {
      ...appDefinition.defaultGeneration,
      ...route.generation,
    },
  };
}

function normalizeCategoryRouteSettings(
  route: AIConfigCategoryRouteSettings,
  appDefinition: AIConfigAppDefinition,
): AIConfigCategoryRouteSettings {
  if (route.enabled && !route.provider) {
    return {
      enabled: true,
      provider: null,
      model: route.model,
      generation: {
        ...appDefinition.defaultGeneration,
        ...route.generation,
      },
    };
  }

  const normalized = normalizeRouteSettings(route, appDefinition);

  return {
    enabled: route.enabled,
    provider: normalized.provider,
    model: normalized.model,
    generation: normalized.generation,
  };
}

function getLegacyRouteFromState(
  state: AIConfigState,
  appDefinition: AIConfigAppDefinition,
): AIConfigRouteSettings {
  const mode = getResolvedMode(state.mode, appDefinition);

  if (
    mode === 'default' &&
    state.selectedProvider !== null &&
    state.selectedProvider !== 'hosted'
  ) {
    return {
      provider: state.selectedProvider,
      model: state.selectedModel,
      generation: {
        ...appDefinition.defaultGeneration,
        ...state.generation,
      },
    };
  }

  if (mode === 'default') {
    return {
      provider: appDefinition.defaultMode?.provider ?? state.selectedProvider ?? null,
      model: appDefinition.defaultMode?.model ?? state.selectedModel ?? null,
      generation: {
        ...appDefinition.defaultGeneration,
        ...state.generation,
      },
    };
  }

  return {
    provider: state.selectedProvider,
    model: state.selectedModel,
    generation: {
      ...appDefinition.defaultGeneration,
      ...state.generation,
    },
  };
}

function getAllowedProviders(appDefinition: AIConfigAppDefinition): Set<AIProviderId> {
  const providers = new Set<AIProviderId>();

  if (appDefinition.defaultMode?.enabled !== false) {
    providers.add('hosted');
  }

  if (appDefinition.defaultMode?.enabled && appDefinition.defaultMode.provider) {
    providers.add(appDefinition.defaultMode.provider);
  }

  if (appDefinition.byok?.enabled !== false) {
    for (const provider of appDefinition.byok?.providers ?? [
      'openai',
      'anthropic',
      'gemini',
      'openrouter',
    ]) {
      providers.add(provider);
    }
  }

  return providers;
}

function getResolvedMode(
  requestedMode: AIConfigMode,
  appDefinition: AIConfigAppDefinition,
): AIConfigMode {
  if (requestedMode === 'default' && appDefinition.defaultMode?.enabled !== false) {
    return 'default';
  }

  if (requestedMode === 'byok' && appDefinition.byok?.enabled !== false) {
    return 'byok';
  }

  return appDefinition.defaultMode?.enabled === false ? 'byok' : 'default';
}

export function normalizeAIConfigState(
  state: AIConfigState,
  appDefinition: AIConfigAppDefinition,
): AIConfigState {
  const mode = getResolvedMode(state.mode, appDefinition);
  const defaultState = createDefaultAIConfigState(appDefinition);
  const categoryKeys = getCategoryKeys(appDefinition);
  const requestedDefaultRoute =
    state.routes?.default ?? getLegacyRouteFromState(state, appDefinition);

  const normalizedDefaultRoute = normalizeRouteSettings(requestedDefaultRoute, appDefinition, {
    fallbackProvider: mode === 'default' ? (appDefinition.defaultMode?.provider ?? null) : null,
    fallbackModel: mode === 'default' ? (appDefinition.defaultMode?.model ?? null) : null,
    forceProvider: mode === 'default' ? (appDefinition.defaultMode?.provider ?? null) : undefined,
    forceModel: mode === 'default' ? (appDefinition.defaultMode?.model ?? null) : undefined,
  });

  const normalizedCategoryRoutes = Object.fromEntries(
    Array.from(categoryKeys).map((categoryKey) => {
      const route = state.routes?.categories?.[categoryKey] ??
        defaultState.routes?.categories?.[categoryKey] ?? {
          enabled: false,
          provider: null,
          model: null,
          generation: {},
        };

      return [categoryKey, normalizeCategoryRouteSettings(route, appDefinition)];
    }),
  );

  const selectedProvider = normalizedDefaultRoute.provider;
  const selectedModel = normalizedDefaultRoute.model;

  return {
    ...state,
    mode,
    selectedProvider,
    selectedModel,
    generation: {
      ...normalizedDefaultRoute.generation,
    },
    routes: {
      default: normalizedDefaultRoute,
      categories: normalizedCategoryRoutes,
    },
    usagePresentation: {
      ...appDefinition.usagePresentation,
      ...state.usagePresentation,
    },
  };
}

export function mergeAIConfigWithAppDefinition(
  appDefinition: AIConfigAppDefinition,
  persistedState?: Partial<AIConfigState> | null,
): AIConfigState {
  const baseState = createDefaultAIConfigState(appDefinition);
  const persistedDefaultRoute =
    persistedState?.routes?.default ??
    (persistedState
      ? getLegacyRouteFromState(
          {
            ...baseState,
            ...persistedState,
            generation: {
              ...baseState.generation,
              ...(persistedState.generation ?? {}),
            },
          },
          appDefinition,
        )
      : baseState.routes?.default);

  const mergedState: AIConfigState = {
    ...baseState,
    ...persistedState,
    credentials: {
      ...baseState.credentials,
      ...(persistedState?.credentials ?? {}),
    },
    generation: {
      ...baseState.generation,
      ...(persistedState?.generation ?? {}),
    },
    routes:
      persistedState?.routes === undefined
        ? {
            default: {
              provider: persistedDefaultRoute?.provider ?? null,
              model: persistedDefaultRoute?.model ?? null,
              generation: {
                ...baseState.routes?.default.generation,
                ...(persistedDefaultRoute?.generation ?? {}),
              },
            },
            categories: {
              ...(baseState.routes?.categories ?? {}),
            },
          }
        : {
            default: {
              provider:
                persistedState.routes.default?.provider ??
                baseState.routes?.default.provider ??
                null,
              model:
                persistedState.routes.default?.model ?? baseState.routes?.default.model ?? null,
              generation: {
                ...baseState.routes?.default.generation,
                ...(persistedState.routes.default?.generation ?? {}),
              },
            },
            categories: Object.fromEntries(
              Object.entries({
                ...(baseState.routes?.categories ?? {}),
                ...(persistedState.routes.categories ?? {}),
              }).map(([categoryKey, route]) => [
                categoryKey,
                (() => {
                  const categoryRoute = route as Partial<AIConfigCategoryRouteSettings>;

                  return {
                    enabled:
                      ('enabled' in categoryRoute ? categoryRoute.enabled : undefined) ??
                      baseState.routes?.categories?.[categoryKey]?.enabled ??
                      false,
                    provider:
                      categoryRoute.provider ??
                      baseState.routes?.categories?.[categoryKey]?.provider ??
                      null,
                    model:
                      categoryRoute.model ??
                      baseState.routes?.categories?.[categoryKey]?.model ??
                      null,
                    generation: {
                      ...(baseState.routes?.categories?.[categoryKey]?.generation ?? {}),
                      ...(categoryRoute.generation ?? {}),
                    },
                  };
                })(),
              ]),
            ),
          },
    usagePresentation: {
      ...baseState.usagePresentation,
      ...(persistedState?.usagePresentation ?? {}),
    },
  };

  return normalizeAIConfigState(mergedState, appDefinition);
}
