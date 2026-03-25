import type {
  AIConfigAppDefinition,
  AIConfigMode,
  AIConfigState,
  AICredentialRecord,
  AIGenerationSettings,
  AIProviderId,
} from '../types/public';
import { createDefaultAIConfigState } from './defaults';
import { normalizeAIConfigState } from './merge';

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
  return normalizeAIConfigState(
    {
      ...state,
      selectedProvider: provider,
      selectedModel: provider === state.selectedProvider ? state.selectedModel : null,
    },
    appDefinition,
  );
}

export function setAIConfigModel(
  state: AIConfigState,
  appDefinition: AIConfigAppDefinition,
  modelId: string | null,
): AIConfigState {
  return normalizeAIConfigState(
    {
      ...state,
      selectedModel: modelId,
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
  return {
    ...state,
    generation: {
      ...state.generation,
      ...settings,
    },
  };
}

export function resetAIConfigState(appDefinition: AIConfigAppDefinition): AIConfigState {
  return createDefaultAIConfigState(appDefinition);
}
