import {
  type AIConfigAppDefinition,
  type AIConfigCategoryRouteSettings,
  type AIConfigMode,
  type AIConfigRouteSettings,
  type AIConfigState,
  type AIPersistedConfigPayload,
  AI_CONFIG_SCHEMA_VERSION,
} from '../types/public';

function createDefaultRoute(appDefinition?: AIConfigAppDefinition): AIConfigRouteSettings {
  return {
    provider: appDefinition?.defaultMode?.provider ?? null,
    model: appDefinition?.defaultMode?.model ?? null,
    generation: {
      ...appDefinition?.defaultGeneration,
    },
  };
}

function createDefaultCategoryRoutes(
  appDefinition?: AIConfigAppDefinition,
): Record<string, AIConfigCategoryRouteSettings> {
  return Object.fromEntries(
    (appDefinition?.operationCategories ?? []).map((category) => [
      category.key,
      {
        enabled: false,
        provider: null,
        model: null,
        generation: {},
      },
    ]),
  );
}

export function createDefaultAIConfigState(appDefinition?: AIConfigAppDefinition): AIConfigState {
  const hasDefaultMode = appDefinition?.defaultMode?.enabled ?? true;
  const defaultMode: AIConfigMode = hasDefaultMode ? 'default' : 'byok';
  const defaultRoute = createDefaultRoute(appDefinition);

  return {
    mode: defaultMode,
    selectedProvider: defaultRoute.provider,
    selectedModel: defaultRoute.model,
    credentials: {},
    generation: {
      ...defaultRoute.generation,
    },
    routes: {
      default: defaultRoute,
      categories: createDefaultCategoryRoutes(appDefinition),
    },
    usagePresentation: appDefinition?.usagePresentation,
  };
}

export function createPersistedAIConfigPayload(state: AIConfigState): AIPersistedConfigPayload {
  return {
    schemaVersion: AI_CONFIG_SCHEMA_VERSION,
    state,
  };
}
