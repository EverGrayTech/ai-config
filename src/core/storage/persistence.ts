import { createDefaultAIConfigState, createPersistedAIConfigPayload } from '../config/defaults';
import { mergeAIConfigWithAppDefinition } from '../config/merge';
import {
  type AIConfigAppDefinition,
  type AIConfigState,
  type AIConfigStorageAdapter,
  type AIPersistedConfigPayload,
  AI_CONFIG_SCHEMA_VERSION,
} from '../types/public';

function isPersistedPayload(value: unknown): value is AIPersistedConfigPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'schemaVersion' in value && 'state' in value;
}

export function loadAIConfig(
  storage: AIConfigStorageAdapter,
  appDefinition: AIConfigAppDefinition,
): Promise<AIConfigState> | AIConfigState {
  const loaded = storage.load();

  const resolve = (payload: AIPersistedConfigPayload | null): AIConfigState => {
    if (!isPersistedPayload(payload) || payload.schemaVersion !== AI_CONFIG_SCHEMA_VERSION) {
      return createDefaultAIConfigState(appDefinition);
    }

    return mergeAIConfigWithAppDefinition(appDefinition, payload.state);
  };

  if (loaded instanceof Promise) {
    return loaded.then(resolve);
  }

  return resolve(loaded);
}

export function saveAIConfig(
  storage: AIConfigStorageAdapter,
  state: AIConfigState,
): Promise<void> | void {
  return storage.save(createPersistedAIConfigPayload(state));
}

export function clearAIConfig(storage: AIConfigStorageAdapter): Promise<void> | void {
  return storage.clear();
}
