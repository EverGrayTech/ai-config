import { getModelById, getProviderById } from '../providers/registry';
import { createLocalStorageAIConfigStorageAdapter } from '../storage/localStorage';
import { clearAIConfig, loadAIConfig, saveAIConfig } from '../storage/persistence';
import type {
  AIConfigChangeEvent,
  AIConfigManager,
  AIConfigManagerOptions,
  AIConfigRouteSettings,
  AIConfigState,
  AIConfigStorageAdapter,
  AICredentialRecord,
  AIGenerationSettings,
  AIHostedAuthResult,
  AIHostedInvokeSuccess,
  AIInvokeError,
  AIProviderId,
} from '../types/public';
import {
  clearAIConfigCredential,
  resetAIConfigState,
  setAIConfigCategoryEnabled,
  setAIConfigCredential,
  setAIConfigMode,
  setAIConfigModel,
  setAIConfigProvider,
  setAIConfigRouteModel,
  setAIConfigRouteProvider,
  updateAIConfigGeneration,
  updateAIConfigRouteGeneration,
} from './actions';
import { mergeAIConfigWithAppDefinition } from './merge';

function getMissingCredentialMessage(provider: AIProviderId): string {
  return `Missing credential for provider \"${provider}\".`;
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getDeclaredCategoryKeys(options: AIConfigManagerOptions): Set<string> {
  return new Set((options.appDefinition.operationCategories ?? []).map((category) => category.key));
}

function resolveInvokeRoute(
  state: AIConfigState,
  options: AIConfigManagerOptions,
  category?: string,
): { route: AIConfigRouteSettings; mode: 'default' | 'byok' } | { error: AIInvokeError } {
  const defaultRoute = state.routes?.default ?? {
    provider: state.selectedProvider,
    model: state.selectedModel,
    generation: state.generation,
  };

  if (!category) {
    return {
      route: defaultRoute,
      mode: state.mode,
    };
  }

  const declaredCategories = getDeclaredCategoryKeys(options);
  if (!declaredCategories.has(category)) {
    return {
      error: {
        ok: false,
        category: 'configuration',
        code: 'invalid-category',
        message: `Unknown AI operation category "${category}".`,
        retryable: false,
        details: {
          category,
        },
      },
    };
  }

  const categoryRoute = state.routes?.categories?.[category];
  if (categoryRoute?.enabled && categoryRoute.provider == null) {
    return {
      error: {
        ok: false,
        category: 'configuration',
        code: 'missing-provider',
        message: `AI category override "${category}" is enabled but has no provider selected.`,
        retryable: false,
        details: {
          category,
        },
      },
    };
  }

  if (!categoryRoute) {
    return {
      error: {
        ok: false,
        category: 'configuration',
        code: 'invalid-category',
        message: `Unknown AI operation category "${category}".`,
        retryable: false,
        details: {
          category,
        },
      },
    };
  }

  if (!categoryRoute?.enabled) {
    return {
      route: defaultRoute,
      mode: state.mode,
    };
  }

  if (!categoryRoute.provider) {
    return {
      error: {
        ok: false,
        category: 'configuration',
        code: 'missing-provider',
        message: `AI category override "${category}" is enabled but has no provider selected.`,
        retryable: false,
        details: {
          category,
        },
      },
    };
  }

  return {
    route: categoryRoute,
    mode: categoryRoute.provider === 'hosted' ? 'default' : 'byok',
  };
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
    setRouteProvider(routeKey, provider) {
      return assign(setAIConfigRouteProvider(state, options.appDefinition, routeKey, provider));
    },
    setRouteModel(routeKey, modelId) {
      return assign(setAIConfigRouteModel(state, options.appDefinition, routeKey, modelId));
    },
    updateRouteGeneration(routeKey, settings) {
      return assign(
        updateAIConfigRouteGeneration(state, options.appDefinition, routeKey, settings),
      );
    },
    setCategoryEnabled(categoryKey, enabled) {
      return assign(setAIConfigCategoryEnabled(state, options.appDefinition, categoryKey, enabled));
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
      const resolved = resolveInvokeRoute(state, options, request.category);
      if ('error' in resolved) {
        return resolved.error;
      }

      const selectedProvider = resolved.route.provider;
      const selectedModel = resolved.route.model;

      if (!selectedProvider) {
        return {
          ok: false,
          category: 'configuration',
          code: 'missing-provider',
          message: 'No AI provider is currently selected.',
          retryable: false,
        };
      }

      if (resolved.mode === 'default') {
        if (!options.hostedGateway) {
          return {
            ok: false,
            category: 'configuration',
            code: 'hosted-not-configured',
            message: 'Hosted gateway execution is not configured.',
            retryable: false,
          };
        }

        let auth: AIHostedAuthResult;

        try {
          auth = await options.hostedGateway.gateway.authenticate({
            appId: options.appDefinition.appId,
            clientId: options.hostedGateway.clientId,
          });
        } catch (error) {
          return {
            ok: false,
            category: 'authentication',
            code: 'hosted-auth-failed',
            message: toErrorMessage(error, 'Hosted authentication failed.'),
            retryable: true,
          };
        }

        const invokeRequest = {
          token: auth.token,
          provider: selectedProvider === 'hosted' ? undefined : selectedProvider,
          model: selectedModel ?? undefined,
          input: request.input,
          stream: request.stream,
        };

        let response: AIHostedInvokeSuccess;

        try {
          response = await options.hostedGateway.gateway.invoke(invokeRequest);
        } catch (error) {
          if (!options.hostedGateway.shouldRefreshToken?.(error)) {
            return {
              ok: false,
              category: 'network',
              code: 'hosted-invoke-failed',
              message: toErrorMessage(error, 'Hosted invocation failed.'),
              retryable: true,
            };
          }

          let refreshedAuth: AIHostedAuthResult;

          try {
            refreshedAuth = await options.hostedGateway.gateway.authenticate({
              appId: options.appDefinition.appId,
              clientId: options.hostedGateway.clientId,
            });
          } catch (refreshError) {
            return {
              ok: false,
              category: 'authentication',
              code: 'token-expired',
              message: toErrorMessage(refreshError, 'Hosted token refresh failed.'),
              retryable: true,
            };
          }

          try {
            response = await options.hostedGateway.gateway.invoke({
              ...invokeRequest,
              token: refreshedAuth.token,
            });
          } catch (retryError) {
            return {
              ok: false,
              category: 'network',
              code: 'hosted-invoke-failed',
              message: toErrorMessage(retryError, 'Hosted invocation failed after token refresh.'),
              retryable: true,
            };
          }
        }

        return {
          ok: true,
          provider: response.provider,
          model: response.model,
          output: response.output,
          executionPath: 'hosted',
          providerLabel: getProviderById(response.provider as AIProviderId, options.appDefinition)
            ?.label,
          modelLabel: getModelById(
            response.provider as AIProviderId,
            response.model,
            options.appDefinition,
          )?.label,
          usage: response.usage,
        };
      }

      if (resolved.mode !== 'byok') {
        return {
          ok: false,
          category: 'configuration',
          code: 'unsupported-mode',
          message: `Unsupported AI mode "${resolved.mode}".`,
          retryable: false,
        };
      }

      if (!selectedModel) {
        return {
          ok: false,
          category: 'configuration',
          code: 'missing-model',
          message: 'No AI model is currently selected.',
          retryable: false,
        };
      }

      const credential = state.credentials[selectedProvider];
      if (!credential?.apiKey) {
        return {
          ok: false,
          category: 'configuration',
          code: 'missing-credential',
          message: getMissingCredentialMessage(selectedProvider),
          retryable: false,
        };
      }

      const client = options.directProviders?.getClient(selectedProvider);
      if (!client) {
        return {
          ok: false,
          category: 'configuration',
          code: 'byok-not-configured',
          message: `Direct provider execution is not configured for "${selectedProvider}".`,
          retryable: false,
        };
      }

      let response: AIHostedInvokeSuccess;

      try {
        response = await client.invoke({
          provider: selectedProvider,
          model: selectedModel,
          credential: credential.apiKey,
          input: request.input,
          stream: request.stream,
        });
      } catch (error) {
        return {
          ok: false,
          category: 'provider',
          code: 'direct-invoke-failed',
          message: toErrorMessage(error, 'Direct provider invocation failed.'),
          retryable: true,
        };
      }

      return {
        ok: true,
        provider: response.provider,
        model: response.model,
        output: response.output,
        executionPath: 'byok-direct',
        providerLabel: getProviderById(selectedProvider, options.appDefinition)?.label,
        modelLabel: getModelById(selectedProvider, response.model, options.appDefinition)?.label,
        usage: response.usage,
      };
    },
    getAppDefinition() {
      return options.appDefinition;
    },
  };

  manager.options = options;

  return manager;
}
