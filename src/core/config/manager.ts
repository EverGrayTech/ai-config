import { createLocalStorageAIConfigStorageAdapter } from '../storage/localStorage';
import { clearAIConfig, loadAIConfig, saveAIConfig } from '../storage/persistence';
import type {
  AIConfigChangeEvent,
  AIConfigManager,
  AIConfigManagerOptions,
  AIConfigState,
  AIConfigStorageAdapter,
  AICredentialRecord,
  AIGenerationSettings,
  AIHostedInvokeSuccess,
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

function getMissingCredentialMessage(provider: AIProviderId): string {
  return `Missing credential for provider \"${provider}\".`;
}

export function createAIConfigManager(options: AIConfigManagerOptions): AIConfigManager {
  const storage: AIConfigStorageAdapter =
    options.storage ?? createLocalStorageAIConfigStorageAdapter(options.appDefinition.storageKey);

  let state = mergeAIConfigWithAppDefinition(options.appDefinition, options.initialState);
  const listeners = new Set<(currentState: AIConfigState) => void>();
  const changeListeners = new Set<(event: AIConfigChangeEvent) => void>();

  const emit = (): void => {
    for (const listener of listeners) {
      listener(state);
    }

    const event: AIConfigChangeEvent = { nextState: state };

    for (const listener of changeListeners) {
      listener(event);
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
    onChange(listener) {
      changeListeners.add(listener);

      return () => {
        changeListeners.delete(listener);
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
    async invoke(request) {
      if (!state.selectedProvider) {
        return {
          ok: false,
          code: 'missing-provider',
          message: 'No AI provider is currently selected.',
        };
      }

      if (state.mode === 'default') {
        if (!options.hostedGateway) {
          return {
            ok: false,
            code: 'hosted-not-configured',
            message: 'Hosted gateway execution is not configured.',
          };
        }

        const auth = await options.hostedGateway.gateway.authenticate({
          appId: options.appDefinition.appId,
          clientId: options.hostedGateway.clientId,
        });

        const invokeRequest = {
          token: auth.token,
          provider: state.selectedProvider === 'hosted' ? undefined : state.selectedProvider,
          model: state.selectedModel ?? undefined,
          input: request.input,
          stream: request.stream,
        };

        let response: AIHostedInvokeSuccess;

        try {
          response = await options.hostedGateway.gateway.invoke(invokeRequest);
        } catch (error) {
          if (!options.hostedGateway.shouldRefreshToken?.(error)) {
            throw error;
          }

          const refreshedAuth = await options.hostedGateway.gateway.authenticate({
            appId: options.appDefinition.appId,
            clientId: options.hostedGateway.clientId,
          });

          response = await options.hostedGateway.gateway.invoke({
            ...invokeRequest,
            token: refreshedAuth.token,
          });
        }

        return {
          ok: true,
          provider: response.provider,
          model: response.model,
          output: response.output,
          executionPath: 'hosted',
        };
      }

      if (state.mode !== 'byok') {
        return {
          ok: false,
          code: 'unsupported-mode',
          message: `Unsupported AI mode \"${state.mode}\".`,
        };
      }

      if (!state.selectedModel) {
        return {
          ok: false,
          code: 'missing-model',
          message: 'No AI model is currently selected.',
        };
      }

      const credential = state.credentials[state.selectedProvider];
      if (!credential?.apiKey) {
        return {
          ok: false,
          code: 'missing-credential',
          message: getMissingCredentialMessage(state.selectedProvider),
        };
      }

      const client = options.directProviders?.getClient(state.selectedProvider);
      if (!client) {
        return {
          ok: false,
          code: 'byok-not-configured',
          message: `Direct provider execution is not configured for \"${state.selectedProvider}\".`,
        };
      }

      const response = await client.invoke({
        provider: state.selectedProvider,
        model: state.selectedModel,
        credential: credential.apiKey,
        input: request.input,
        stream: request.stream,
      });

      return {
        ok: true,
        provider: response.provider,
        model: response.model,
        output: response.output,
        executionPath: 'byok-direct',
      };
    },
    getAppDefinition() {
      return options.appDefinition;
    },
  };

  manager.options = options;

  return manager;
}
