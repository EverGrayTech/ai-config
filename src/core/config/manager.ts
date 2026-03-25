import { createLocalStorageAIConfigStorageAdapter } from '../storage/localStorage';
import { clearAIConfig, loadAIConfig, saveAIConfig } from '../storage/persistence';
import type {
  AIConfigManager,
  AIConfigManagerOptions,
  AIConfigState,
  AIConfigStorageAdapter,
  AICredentialRecord,
  AIGenerationSettings,
  AIProviderId,
} from '../types/public';
import {
  clearAIConfigCredential,
  resetAIConfigState,
  setAIConfigCredential,
  setAIConfigMode,
  setAIConfigModel,
  setAIConfigProvider,
  updateAIConfigGeneration,
} from './actions';
import { mergeAIConfigWithAppDefinition } from './merge';

export function createAIConfigManager(options: AIConfigManagerOptions): AIConfigManager {
  const storage: AIConfigStorageAdapter =
    options.storage ?? createLocalStorageAIConfigStorageAdapter(options.appDefinition.storageKey);

  let state = mergeAIConfigWithAppDefinition(options.appDefinition, options.initialState);
  const listeners = new Set<(currentState: AIConfigState) => void>();

  const emit = (): void => {
    for (const listener of listeners) {
      listener(state);
    }
  };

  const assign = (nextState: AIConfigState): AIConfigState => {
    state = nextState;
    emit();
    return state;
  };

  const manager: AIConfigManager & { options?: AIConfigManagerOptions } = {
    getState() {
      return state;
    },
    setMode(mode) {
      return assign(setAIConfigMode(state, options.appDefinition, mode));
    },
    setProvider(provider) {
      return assign(setAIConfigProvider(state, options.appDefinition, provider));
    },
    setModel(modelId) {
      return assign(setAIConfigModel(state, options.appDefinition, modelId));
    },
    setCredential(
      provider: AIProviderId,
      credential: Pick<AICredentialRecord, 'apiKey' | 'label'>,
    ) {
      return assign(setAIConfigCredential(state, provider, credential));
    },
    clearCredential(provider: AIProviderId) {
      return assign(clearAIConfigCredential(state, provider));
    },
    updateGeneration(settings: Partial<AIGenerationSettings>) {
      return assign(updateAIConfigGeneration(state, settings));
    },
    reset() {
      return assign(resetAIConfigState(options.appDefinition));
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    async load() {
      const loaded = await loadAIConfig(storage, options.appDefinition);
      return assign(loaded);
    },
    async save() {
      await saveAIConfig(storage, state);
    },
    async clearPersisted() {
      await clearAIConfig(storage);
      assign(resetAIConfigState(options.appDefinition));
    },
    getAppDefinition() {
      return options.appDefinition;
    },
  };

  manager.options = options;

  return manager;
}
