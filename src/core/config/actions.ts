import type {
  AIConfigAppDefinition,
  AIConfigCategoryRouteSettings,
  AIConfigMode,
  AIConfigRouteSettings,
  AIConfigState,
  AICredentialRecord,
  AIGenerationSettings,
  AIProviderId,
} from '../types/public';
import { createDefaultAIConfigState } from './defaults';
import { normalizeAIConfigState } from './merge';

function getEditableDefaultRoute(state: AIConfigState): AIConfigRouteSettings {
  return (
    state.routes?.default ?? {
      provider: state.selectedProvider,
      model: state.selectedModel,
      generation: state.generation,
    }
  );
}

function getCategoryKeys(appDefinition: AIConfigAppDefinition): Set<string> {
  return new Set((appDefinition.operationCategories ?? []).map((category) => category.key));
}

function getEditableCategoryRoute(
  state: AIConfigState,
  categoryKey: string,
): AIConfigCategoryRouteSettings | null {
  return state.routes?.categories?.[categoryKey] ?? null;
}

export function setAIConfigMode(
  state: AIConfigState,
  appDefinition: AIConfigAppDefinition,
  mode: AIConfigMode,
): AIConfigState {
  return normalizeAIConfigState(
    {
      ...state,
      mode,
    },
    appDefinition,
  );
}

export function setAIConfigProvider(
  state: AIConfigState,
  appDefinition: AIConfigAppDefinition,
  provider: AIProviderId | null,
): AIConfigState {
  const currentRoute = getEditableDefaultRoute(state);

  return normalizeAIConfigState(
    {
      ...state,
      selectedProvider: provider,
      selectedModel: provider === state.selectedProvider ? state.selectedModel : null,
      routes: {
        default: {
          ...currentRoute,
          provider,
          model: provider === currentRoute.provider ? currentRoute.model : null,
        },
        categories: {
          ...(state.routes?.categories ?? {}),
        },
      },
    },
    appDefinition,
  );
}

export function setAIConfigModel(
  state: AIConfigState,
  appDefinition: AIConfigAppDefinition,
  modelId: string | null,
): AIConfigState {
  const currentRoute = getEditableDefaultRoute(state);

  return normalizeAIConfigState(
    {
      ...state,
      selectedModel: modelId,
      routes: {
        default: {
          ...currentRoute,
          model: modelId,
        },
        categories: {
          ...(state.routes?.categories ?? {}),
        },
      },
    },
    appDefinition,
  );
}

export function setAIConfigCredential(
  state: AIConfigState,
  provider: AIProviderId,
  credential: Pick<AICredentialRecord, 'apiKey' | 'label'>,
): AIConfigState {
  return {
    ...state,
    credentials: {
      ...state.credentials,
      [provider]: {
        provider,
        apiKey: credential.apiKey,
        label: credential.label,
        isPresent: Boolean(credential.apiKey),
        validationState: 'unknown',
      },
    },
  };
}

export function clearAIConfigCredential(
  state: AIConfigState,
  provider: AIProviderId,
): AIConfigState {
  const nextCredentials = { ...state.credentials };
  delete nextCredentials[provider];

  return {
    ...state,
    credentials: nextCredentials,
  };
}

export function updateAIConfigGeneration(
  state: AIConfigState,
  settings: Partial<AIGenerationSettings>,
): AIConfigState {
  const currentRoute = getEditableDefaultRoute(state);

  return {
    ...state,
    generation: {
      ...state.generation,
      ...settings,
    },
    routes: {
      default: {
        ...currentRoute,
        generation: {
          ...currentRoute.generation,
          ...settings,
        },
      },
      categories: {
        ...(state.routes?.categories ?? {}),
      },
    },
  };
}

export function setAIConfigRouteProvider(
  state: AIConfigState,
  appDefinition: AIConfigAppDefinition,
  routeKey: 'default' | string,
  provider: AIProviderId | null,
): AIConfigState {
  if (routeKey === 'default') {
    return setAIConfigProvider(state, appDefinition, provider);
  }

  if (!getCategoryKeys(appDefinition).has(routeKey)) {
    return state;
  }

  const currentRoute = getEditableCategoryRoute(state, routeKey);
  if (!currentRoute) {
    return state;
  }

  return normalizeAIConfigState(
    {
      ...state,
      routes: {
        default: {
          ...getEditableDefaultRoute(state),
        },
        categories: {
          ...(state.routes?.categories ?? {}),
          [routeKey]: {
            ...currentRoute,
            provider,
            model: provider === currentRoute.provider ? currentRoute.model : null,
          },
        },
      },
    },
    appDefinition,
  );
}

export function setAIConfigRouteModel(
  state: AIConfigState,
  appDefinition: AIConfigAppDefinition,
  routeKey: 'default' | string,
  modelId: string | null,
): AIConfigState {
  if (routeKey === 'default') {
    return setAIConfigModel(state, appDefinition, modelId);
  }

  if (!getCategoryKeys(appDefinition).has(routeKey)) {
    return state;
  }

  const currentRoute = getEditableCategoryRoute(state, routeKey);
  if (!currentRoute) {
    return state;
  }

  return normalizeAIConfigState(
    {
      ...state,
      routes: {
        default: {
          ...getEditableDefaultRoute(state),
        },
        categories: {
          ...(state.routes?.categories ?? {}),
          [routeKey]: {
            ...currentRoute,
            model: modelId,
          },
        },
      },
    },
    appDefinition,
  );
}

export function updateAIConfigRouteGeneration(
  state: AIConfigState,
  appDefinition: AIConfigAppDefinition,
  routeKey: 'default' | string,
  settings: Partial<AIGenerationSettings>,
): AIConfigState {
  if (routeKey === 'default') {
    return updateAIConfigGeneration(state, settings);
  }

  if (!getCategoryKeys(appDefinition).has(routeKey)) {
    return state;
  }

  const currentRoute = getEditableCategoryRoute(state, routeKey);
  if (!currentRoute) {
    return state;
  }

  return normalizeAIConfigState(
    {
      ...state,
      routes: {
        default: {
          ...getEditableDefaultRoute(state),
        },
        categories: {
          ...(state.routes?.categories ?? {}),
          [routeKey]: {
            ...currentRoute,
            generation: {
              ...currentRoute.generation,
              ...settings,
            },
          },
        },
      },
    },
    appDefinition,
  );
}

export function setAIConfigCategoryEnabled(
  state: AIConfigState,
  appDefinition: AIConfigAppDefinition,
  categoryKey: string,
  enabled: boolean,
): AIConfigState {
  if (!getCategoryKeys(appDefinition).has(categoryKey)) {
    return state;
  }

  const currentRoute = getEditableCategoryRoute(state, categoryKey);
  if (!currentRoute) {
    return state;
  }

  return normalizeAIConfigState(
    {
      ...state,
      routes: {
        default: {
          ...getEditableDefaultRoute(state),
        },
        categories: {
          ...(state.routes?.categories ?? {}),
          [categoryKey]: {
            ...currentRoute,
            enabled,
          },
        },
      },
    },
    appDefinition,
  );
}

export function resetAIConfigState(appDefinition: AIConfigAppDefinition): AIConfigState {
  return createDefaultAIConfigState(appDefinition);
}
