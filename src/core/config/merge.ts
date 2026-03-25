import { getAvailableModels } from '../providers/registry';
import type {
  AIConfigAppDefinition,
  AIConfigMode,
  AIConfigState,
  AIProviderId,
} from '../types/public';
import { createDefaultAIConfigState } from './defaults';

function getAllowedProviders(appDefinition: AIConfigAppDefinition): Set<AIProviderId> {
  const providers = new Set<AIProviderId>();

  if (appDefinition.defaultMode?.enabled && appDefinition.defaultMode.provider) {
    providers.add(appDefinition.defaultMode.provider);
  }

  for (const provider of appDefinition.byok?.providers ?? []) {
    providers.add(provider);
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
  const allowedProviders = getAllowedProviders(appDefinition);
  const mode = getResolvedMode(state.mode, appDefinition);

  let selectedProvider = state.selectedProvider;
  if (selectedProvider && !allowedProviders.has(selectedProvider)) {
    selectedProvider = mode === 'default' ? (appDefinition.defaultMode?.provider ?? null) : null;
  }

  if (mode === 'default') {
    selectedProvider = appDefinition.defaultMode?.provider ?? selectedProvider ?? null;
  }

  if (mode === 'byok' && appDefinition.byok?.enabled === false) {
    selectedProvider = appDefinition.defaultMode?.provider ?? null;
  }

  let selectedModel = state.selectedModel;
  if (mode === 'default' && appDefinition.defaultMode?.model) {
    selectedModel = appDefinition.defaultMode.model;
  }

  if (selectedProvider && selectedModel) {
    const availableModels = getAvailableModels(selectedProvider, appDefinition);
    const modelStillAvailable = availableModels.some((model) => model.id === selectedModel);

    if (!modelStillAvailable) {
      selectedModel = mode === 'default' ? (appDefinition.defaultMode?.model ?? null) : null;
    }
  }

  return {
    ...state,
    mode,
    selectedProvider,
    selectedModel,
    generation: {
      ...appDefinition.defaultGeneration,
      ...state.generation,
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
    usagePresentation: {
      ...baseState.usagePresentation,
      ...(persistedState?.usagePresentation ?? {}),
    },
  };

  return normalizeAIConfigState(mergedState, appDefinition);
}
