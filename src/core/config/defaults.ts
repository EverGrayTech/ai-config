import {
  type AIConfigAppDefinition,
  type AIConfigMode,
  type AIConfigState,
  type AIPersistedConfigPayload,
  AI_CONFIG_SCHEMA_VERSION,
} from '../types/public';

export function createDefaultAIConfigState(appDefinition?: AIConfigAppDefinition): AIConfigState {
  const hasDefaultMode = appDefinition?.defaultMode?.enabled ?? true;
  const defaultMode: AIConfigMode = hasDefaultMode ? 'default' : 'byok';

  return {
    mode: defaultMode,
    selectedProvider: appDefinition?.defaultMode?.provider ?? null,
    selectedModel: appDefinition?.defaultMode?.model ?? null,
    credentials: {},
    generation: {
      ...appDefinition?.defaultGeneration,
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
