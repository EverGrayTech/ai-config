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
  AIHostedGatewayError,
  AIHostedInvokeSuccess,
  AIInvokeError,
  AIInvokeRequest,
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

function toGatewayProvider(provider: AIProviderId): string {
  return provider === 'gemini' ? 'gemini' : provider;
}

function getMissingCredentialMessage(provider: AIProviderId): string {
  return `Missing credential for provider \"${provider}\".`;
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getHostedErrorDetails(error: unknown): AIInvokeError['upstream'] {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const hostedError = error as AIHostedGatewayError;

  const upstream = {
    status: hostedError.status,
    code: hostedError.code,
    category: hostedError.category,
    message: hostedError.message,
    retryable: hostedError.retryable,
    details: hostedError.details,
  };

  if (
    upstream.status === undefined &&
    upstream.code === undefined &&
    upstream.category === undefined &&
    upstream.retryable === undefined &&
    upstream.details === undefined
  ) {
    return undefined;
  }

  return upstream;
}

function getHostedGatewayOptions(options: AIConfigManagerOptions) {
  if (!options.hostedGateway) {
    throw new Error('Hosted gateway execution is not configured.');
  }

  return options.hostedGateway;
}

function normalizeHostedInvokeError(
  error: unknown,
): Pick<AIInvokeError, 'category' | 'code' | 'message' | 'retryable' | 'upstream'> {
  const upstream = getHostedErrorDetails(error);

  if (upstream?.category === 'rate-limit') {
    return {
      category: 'rate-limit',
      code: 'hosted-invoke-failed',
      message: upstream.message ?? toErrorMessage(error, 'Hosted invocation failed.'),
      retryable: upstream.retryable ?? true,
      upstream,
    };
  }

  if (upstream?.category === 'policy' || upstream?.status === 403) {
    return {
      category: 'policy',
      code: 'hosted-invoke-failed',
      message:
        upstream.message ??
        toErrorMessage(error, 'Hosted invocation was rejected by gateway policy.'),
      retryable: upstream.retryable ?? false,
      upstream,
    };
  }

  if (upstream?.category === 'authentication' || upstream?.status === 401) {
    return {
      category: 'authentication',
      code: 'hosted-invoke-failed',
      message:
        upstream.message ?? toErrorMessage(error, 'Hosted invocation authentication failed.'),
      retryable: upstream.retryable ?? true,
      upstream,
    };
  }

  return {
    category: 'network',
    code: 'hosted-invoke-failed',
    message: upstream?.message ?? toErrorMessage(error, 'Hosted invocation failed.'),
    retryable: upstream?.retryable ?? true,
    upstream,
  };
}

async function authenticateHostedGateway(
  options: AIConfigManagerOptions,
): Promise<AIHostedAuthResult> {
  const hostedGateway = getHostedGatewayOptions(options);

  return hostedGateway.gateway.authenticate({
    appId: options.appDefinition.appId,
    clientId: hostedGateway.clientId,
  });
}

async function invokeHostedGateway(
  options: AIConfigManagerOptions,
  invokeRequest: {
    token: string;
    provider?: string;
    model?: string;
    credential?: string;
    input: string;
    stream?: boolean;
  },
): Promise<AIHostedInvokeSuccess> {
  return getHostedGatewayOptions(options).gateway.invoke(invokeRequest);
}

function shouldOmitHostedModel(
  selectedProvider: AIProviderId,
  selectedModel: string | null,
  options: AIConfigManagerOptions,
): boolean {
  if (selectedProvider !== 'hosted') {
    return false;
  }

  const defaultHostedModel =
    options.appDefinition.defaultMode?.provider === 'hosted'
      ? (options.appDefinition.defaultMode.model ?? null)
      : null;

  return (
    selectedModel == null || (defaultHostedModel != null && selectedModel === defaultHostedModel)
  );
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

  const assign = (nextState: AIConfigState, options?: { persist?: boolean }): AIConfigState => {
    state = nextState;
    emit();
    if (options?.persist ?? true) {
      void saveAIConfig(storage, state);
    }
    return state;
  };

  const flushPendingState = (candidateState?: AIConfigState): void => {
    if (!candidateState) {
      return;
    }

    if (candidateState === state) {
      return;
    }

    state = candidateState;
    emit();
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
      return assign(loaded, { persist: false });
    },
    async save() {
      await saveAIConfig(storage, state);
    },
    async clearPersisted() {
      await clearAIConfig(storage);
      assign(resetAIConfigState(options.appDefinition), { persist: false });
    },
    async invoke(request) {
      flushPendingState(
        (request as AIInvokeRequest & { __resolvedState?: AIConfigState }).__resolvedState,
      );

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

      if (resolved.mode !== 'default' && resolved.mode !== 'byok') {
        return {
          ok: false,
          category: 'configuration',
          code: 'unsupported-mode',
          message: `Unsupported AI mode "${resolved.mode}".`,
          retryable: false,
        };
      }

      if (!options.hostedGateway) {
        return {
          ok: false,
          category: 'configuration',
          code: 'hosted-not-configured',
          message: 'Hosted gateway execution is not configured.',
          retryable: false,
        };
      }

      if (resolved.mode === 'byok' && !selectedModel) {
        return {
          ok: false,
          category: 'configuration',
          code: 'missing-model',
          message: 'No AI model is currently selected.',
          retryable: false,
        };
      }

      const credential = state.credentials[selectedProvider];
      if (resolved.mode === 'byok' && !credential?.apiKey) {
        return {
          ok: false,
          category: 'configuration',
          code: 'missing-credential',
          message: getMissingCredentialMessage(selectedProvider),
          retryable: false,
        };
      }

      let auth: AIHostedAuthResult;

      try {
        auth = await authenticateHostedGateway(options);
      } catch (error) {
        return {
          ok: false,
          category: 'authentication',
          code: 'hosted-auth-failed',
          message: toErrorMessage(error, 'Hosted authentication failed.'),
          retryable: true,
          upstream: getHostedErrorDetails(error),
        };
      }

      const isHostedDefaultRequest = resolved.mode === 'default' && selectedProvider === 'hosted';

      const invokeRequest = isHostedDefaultRequest
        ? {
            token: auth.token,
            input: request.input,
            stream: request.stream,
          }
        : {
            token: auth.token,
            provider: toGatewayProvider(selectedProvider),
            model: selectedModel ?? undefined,
            credential: resolved.mode === 'byok' ? credential?.apiKey : undefined,
            input: request.input,
            stream: request.stream,
          };

      let response: AIHostedInvokeSuccess;

      try {
        response = await invokeHostedGateway(options, invokeRequest);
      } catch (error) {
        if (!options.hostedGateway.shouldRefreshToken?.(error)) {
          return {
            ok: false,
            ...normalizeHostedInvokeError(error),
          };
        }

        let refreshedAuth: AIHostedAuthResult;

        try {
          refreshedAuth = await authenticateHostedGateway(options);
        } catch (refreshError) {
          return {
            ok: false,
            category: 'authentication',
            code: 'token-expired',
            message: toErrorMessage(refreshError, 'Hosted token refresh failed.'),
            retryable: true,
            upstream: getHostedErrorDetails(refreshError),
          };
        }

        try {
          response = await invokeHostedGateway(options, {
            ...invokeRequest,
            token: refreshedAuth.token,
          });
        } catch (retryError) {
          const normalizedRetryError = normalizeHostedInvokeError(retryError);

          return {
            ok: false,
            ...normalizedRetryError,
            message:
              normalizedRetryError.upstream?.message ??
              toErrorMessage(retryError, 'Hosted invocation failed after token refresh.'),
          };
        }
      }

      return {
        ok: true,
        provider: response.provider,
        model: response.model,
        output: response.output,
        executionPath: resolved.mode === 'byok' ? 'byok-gateway' : 'hosted',
        providerLabel: getProviderById(
          resolved.mode === 'byok' ? selectedProvider : (response.provider as AIProviderId),
          options.appDefinition,
        )?.label,
        modelLabel: getModelById(
          resolved.mode === 'byok' ? selectedProvider : (response.provider as AIProviderId),
          response.model,
          options.appDefinition,
        )?.label,
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
