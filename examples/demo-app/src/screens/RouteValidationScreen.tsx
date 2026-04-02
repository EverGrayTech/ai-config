import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  createAIConfigManager,
  sanitizeAIConfigForDebug,
  AIConfigAppDefinition,
  AIConfigManager,
  AIConfigState,
  AIHostedAuthRequest,
  AIHostedAuthResult,
  AIHostedGatewayClient,
  AIHostedGatewayError,
  AIHostedInvokeRequest,
  AIHostedInvokeSuccess,
  AIInvokeRequest,
  AIInvokeResult,
} from '@evergraytech/ai-config';
import { AIConfigPanel, AIConfigProvider } from '@evergraytech/ai-config/react';

import { DemoCard } from '../components/DemoCard';

const DEFAULT_PROMPT = 'What model are you? Please identify the model you are using.';
const DEFAULT_GATEWAY_BASE_URL = 'https://ai.evergraytech.com/';
const DEFAULT_CLIENT_ID = 'demo-client-id';

type LogEntry = {
  id: number;
  timestamp: string;
  scope: 'config' | 'gateway' | 'invoke' | 'result';
  event: string;
  payload: unknown;
};

type DemoGatewayConfig = {
  baseUrl: string;
  clientId: string;
};

type ValidationHarnessProps = {
  title: string;
  description: string;
  appDefinition: AIConfigAppDefinition;
  categoryOptions: string[];
  gatewayConfig: DemoGatewayConfig;
};

function resolveDisplayedInvokeSnapshot(
  state: AIConfigState,
  category?: string | null,
) {
  const defaultRoute = state.routes?.default ?? {
    provider: state.selectedProvider,
    model: state.selectedModel,
    generation: state.generation,
  };

  if (!category) {
    const isHostedDefault = state.mode === 'default' && defaultRoute.provider === 'hosted';

    return {
      category: null,
      requestShape: isHostedDefault ? 'hosted-default' : 'explicit-byok',
      route: defaultRoute,
    };
  }

  const categoryRoute = state.routes?.categories?.[category];
  if (!categoryRoute || !categoryRoute.enabled) {
    const isHostedDefault = state.mode === 'default' && defaultRoute.provider === 'hosted';

    return {
      category,
      requestShape: isHostedDefault ? 'hosted-default' : 'explicit-byok',
      route: defaultRoute,
    };
  }

  return {
    category,
    requestShape: categoryRoute.provider === 'hosted' ? 'hosted-default' : 'explicit-byok',
    route: categoryRoute,
  };
}

function getEnvValue(key: string): string | undefined {
  const env = import.meta.env as Record<string, string | undefined>;
  return env[key];
}

function createGatewayClient(
  gatewayConfig: DemoGatewayConfig,
  appendLog: (scope: LogEntry['scope'], event: string, payload: unknown) => void,
): AIHostedGatewayClient {
  const baseUrl = gatewayConfig.baseUrl.replace(/\/$/, '');

  return {
    async authenticate(request: AIHostedAuthRequest): Promise<AIHostedAuthResult> {
      appendLog('gateway', 'authenticate:request', {
        url: `${baseUrl}/auth`,
        body: request,
      });

      const response = await fetch(`${baseUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const payload = await response.json().catch(() => null);
      appendLog('gateway', 'authenticate:response', {
        ok: response.ok,
        status: response.status,
        body: payload,
      });

      if (!response.ok || !payload?.token) {
        const error = new Error(
          payload?.message ?? `Gateway auth failed with status ${response.status}.`,
        ) as AIHostedGatewayError;

        error.status = response.status;
        error.code = payload?.code;
        error.category = payload?.category;
        error.retryable = payload?.retryable;
        error.details = payload?.details;

        throw error;
      }

      return payload satisfies AIHostedAuthResult;
    },

    async invoke(request: AIHostedInvokeRequest): Promise<AIHostedInvokeSuccess> {
      appendLog('gateway', 'invoke:request', {
        url: `${baseUrl}/ai`,
        body: {
          ...request,
          credential: request.credential ? '[REDACTED]' : undefined,
        },
      });

      const response = await fetch(`${baseUrl}/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${request.token}`,
          ...(request.credential
            ? {
                'X-EG-AI-Provider-Credential': request.credential,
              }
            : {}),
        },
        body: JSON.stringify({
          provider: request.provider,
          model: request.model,
          input: request.input,
          stream: request.stream,
        }),
      });

      const payload = await response.json().catch(() => null);
      appendLog('gateway', 'invoke:response', {
        ok: response.ok,
        status: response.status,
        body: payload,
      });

      if (!response.ok || !payload?.provider || !payload?.model) {
        const error = new Error(
          payload?.message ?? `Gateway invoke failed with status ${response.status}.`,
        ) as AIHostedGatewayError;

        error.status = response.status;
        error.code = payload?.code;
        error.category = payload?.category;
        error.retryable = payload?.retryable;
        error.details = payload?.details;

        throw error;
      }

      return payload satisfies AIHostedInvokeSuccess;
    },
  };
}

function ValidationHarness({
  title,
  description,
  appDefinition,
  categoryOptions,
  gatewayConfig,
}: ValidationHarnessProps) {
  const logIdRef = useRef(0);
  const managerRef = useRef<AIConfigManager | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [invokeResult, setInvokeResult] = useState<AIInvokeResult | null>(null);
  const [invokeMeta, setInvokeMeta] = useState<{
    requestedAt: string;
    category: string | null;
    prompt: string;
    state: unknown;
    resolvedInvoke: unknown;
  } | null>(null);
  const [isInvoking, setIsInvoking] = useState(false);
  const [stateSnapshot, setStateSnapshot] = useState<unknown>(null);
  const latestStateRef = useRef<AIConfigState | null>(null);
  const gatewayClientId = gatewayConfig.clientId;
  const gatewayRef = useRef<AIHostedGatewayClient | null>(null);

  const appendLog = React.useCallback(
    (scope: LogEntry['scope'], event: string, payload: unknown) => {
      setLogs((current) => [
        {
          id: ++logIdRef.current,
          timestamp: new Date().toISOString(),
          scope,
          event,
          payload,
        },
        ...current,
      ]);
    },
    [],
  );

  if (!gatewayRef.current) {
    gatewayRef.current = createGatewayClient(gatewayConfig, appendLog);
  }

  const manager = useMemo(() => {
    const nextManager = createAIConfigManager({
      appDefinition,
      hostedGateway: {
        clientId: gatewayClientId,
        gateway: gatewayRef.current,
      },
    });

    managerRef.current = nextManager;
    const initialState = nextManager.getState();
    latestStateRef.current = initialState;
    setStateSnapshot(sanitizeAIConfigForDebug(initialState));
    return nextManager;
  }, [appDefinition, gatewayClientId]);

  useEffect(() => {
    const unsubscribe = manager.subscribe((nextState: AIConfigState) => {
      latestStateRef.current = nextState;
      const sanitized = sanitizeAIConfigForDebug(nextState);
      setStateSnapshot(sanitized);
      appendLog('config', 'state:changed', sanitized);
    });

    latestStateRef.current = manager.getState();
    appendLog('config', 'state:initial', sanitizeAIConfigForDebug(manager.getState()));

    return unsubscribe;
  }, [appendLog, manager]);

  const invoke = async (category?: string) => {
    const effectiveManager = managerRef.current;
    if (!effectiveManager) {
      return;
    }

    const request: AIInvokeRequest = {
      input: prompt,
      category,
    };

    const sourceState = latestStateRef.current ?? effectiveManager.getState();
    const snapshot = sanitizeAIConfigForDebug(sourceState) as AIConfigState;

    appendLog('invoke', 'invoke:request', {
      category: category ?? null,
      request,
      state: snapshot,
      resolvedInvoke: resolveDisplayedInvokeSnapshot(snapshot, category ?? null),
    });

    setInvokeMeta({
      requestedAt: new Date().toISOString(),
      category: category ?? null,
      prompt: request.input,
      state: snapshot,
      resolvedInvoke: resolveDisplayedInvokeSnapshot(snapshot, category ?? null),
    });

    setIsInvoking(true);
    setInvokeResult(null);

    try {
      const result = await effectiveManager.invoke({
        ...request,
        __resolvedState: sourceState,
      } as AIInvokeRequest & { __resolvedState: AIConfigState });
      setInvokeResult(result);
      appendLog('result', 'invoke:result', result);
    } catch (error) {
      const fallback = {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown invoke failure',
      };
      setInvokeResult(fallback as AIInvokeResult);
      appendLog('result', 'invoke:thrown-error', fallback);
    } finally {
      setIsInvoking(false);
    }
  };

  return (
    <DemoCard title={title} description={description}>
      <div className="demo-stack">
        <section className="demo-section-group" aria-label="AI configuration">
          <div className="demo-section-heading">
            <h4>AI Configuration</h4>
            <p>Adjust provider, model, credentials, and generation settings.</p>
          </div>
          <AIConfigProvider appDefinition={appDefinition} manager={manager}>
            <AIConfigPanel />
          </AIConfigProvider>
        </section>

        <section className="demo-section-group" aria-label="Invocation controls">
          <div className="demo-section-heading">
            <h4>Invocation</h4>
            <p>Choose the prompt and route to exercise the currently resolved configuration.</p>
          </div>
          <div className="demo-invoke-controls">
            <label className="demo-field">
              Prompt
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} />
            </label>

            {categoryOptions.length > 0 ? (
              <label className="demo-field">
                Category
                <select
                  value={activeCategory}
                  onChange={(event) => setActiveCategory(event.target.value)}
                >
                  <option value="">Default route (no category)</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="demo-button-row">
              <button type="button" onClick={() => invoke()} disabled={isInvoking}>
                {categoryOptions.length > 0 ? 'Invoke default route' : 'Invoke'}
              </button>
              {categoryOptions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => invoke(category)}
                  disabled={isInvoking}
                >
                  Invoke {category}
                </button>
              ))}
              {categoryOptions.length > 0 ? (
                <button
                  type="button"
                  onClick={() => invoke(activeCategory || undefined)}
                  disabled={isInvoking}
                >
                  Invoke selected option
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="demo-section-group" aria-label="Invocation results">
          <div className="demo-section-heading">
            <h4>Request and Results</h4>
            <p>
              Review the latest invocation request and the returned results.
            </p>
          </div>
          <div className="demo-grid demo-grid--logs">
            <section className="demo-log-panel">
              <h4>Latest invocation request</h4>
              <pre>
                {JSON.stringify(
                  invokeMeta
                    ? {
                        requestedAt: invokeMeta.requestedAt,
                        category: invokeMeta.category,
                        request: {
                          input: invokeMeta.prompt,
                          category: invokeMeta.category ?? undefined,
                        },
                        resolvedInvoke: invokeMeta.resolvedInvoke,
                      }
                    : null,
                  null,
                  2,
                )}
              </pre>
            </section>

            <section
              className="demo-log-panel"
              data-demo-result-status={invokeResult == null ? 'idle' : invokeResult.ok ? 'success' : 'error'}
            >
              <h4>Latest invocation result</h4>
              {invokeMeta ? (
                <div className="demo-result-summary">
                  <strong>
                    {invokeResult == null
                      ? 'Invoking…'
                      : invokeResult.ok
                        ? 'Success'
                        : 'Configuration or invocation error'}
                  </strong>
                  <span>
                    {invokeMeta.category ? `Category: ${invokeMeta.category}` : 'Default route'}
                  </span>
                  <span>{invokeMeta.requestedAt}</span>
                </div>
              ) : null}
              {!invokeResult?.ok && invokeResult ? (
                <div className="demo-result-alert" role="alert">
                  <strong>{invokeResult.code}</strong>
                  <p>{invokeResult.message}</p>
                  <p className="demo-result-alert-hint">
                    Check the selected provider, model, and API key before invoking again.
                  </p>
                </div>
              ) : null}
              <pre>{JSON.stringify(invokeResult, null, 2)}</pre>
            </section>
          </div>
        </section>

        <section className="demo-section-group" aria-label="Gateway and invocation log">
          <div className="demo-section-heading">
            <h4>Gateway + invocation log</h4>
            <p>Use the event log for request/response debugging and route verification.</p>
          </div>
          <section className="demo-log-panel">
            <div className="demo-log-list">
              {logs.map((entry) => (
                <article key={entry.id} className="demo-log-entry">
                  <div className="demo-log-meta">
                    <strong>{entry.scope}</strong>
                    <span>{entry.event}</span>
                    <time>{entry.timestamp}</time>
                  </div>
                  <pre>{JSON.stringify(entry.payload, null, 2)}</pre>
                </article>
              ))}
            </div>
          </section>
        </section>
      </div>
    </DemoCard>
  );
}

export function RouteValidationScreen() {
  const gatewayConfig = useMemo(
    () => ({
      baseUrl: getEnvValue('VITE_AI_GATEWAY_BASE_URL') ?? DEFAULT_GATEWAY_BASE_URL,
      clientId: getEnvValue('VITE_AI_GATEWAY_CLIENT_ID') ?? DEFAULT_CLIENT_ID,
    }),
    [],
  );

  const defaultOnlyDefinition = useMemo<AIConfigAppDefinition>(
    () => ({
      appId: 'ai-config-demo-default-only',
      defaultMode: {
        enabled: true,
        label: 'Free Trial',
        provider: 'hosted',
        usageHint: 'Default-only validation flow for hosted routing.',
      },
      byok: {
        enabled: true,
        providers: ['anthropic', 'gemini', 'openai', 'openrouter'],
      },
      defaultGeneration: {
        temperature: 0.4,
        maxOutputTokens: 600,
      },
    }),
    [],
  );

  const categorizedDefinition = useMemo<AIConfigAppDefinition>(
    () => ({
      appId: 'ai-config-demo-categorized',
      defaultMode: {
        enabled: true,
        label: 'Free Trial',
        provider: 'hosted',
        usageHint: 'Categorized validation flow for route overrides.',
      },
      byok: {
        enabled: true,
        providers: ['anthropic', 'gemini', 'openai', 'openrouter'],
      },
      defaultGeneration: {
        temperature: 0.4,
        maxOutputTokens: 600,
      },
      operationCategories: [
        {
          key: 'evaluate',
          label: 'Evaluate',
          description: 'Validation and scoring tasks.',
        },
        {
          key: 'write',
          label: 'Write',
          description: 'Generation-heavy drafting tasks.',
        },
      ],
    }),
    [],
  );

  return (
    <div className="demo-stack">
      <DemoCard
        title="Overview validation guide"
        description="Use this screen as the primary overview for validating both the streamlined panel UX and the hosted gateway routing flows."
      >
        <ul className="demo-list">
          <li>Use the default prompt or ask the model to identify itself.</li>
          <li>Validate default-only routing with no categories enabled.</li>
          <li>
            In the categorized example, compare Default route behavior against `evaluate` and
            `write`.
          </li>
          <li>
            Enable a category override, change provider/model settings, then compare the request
            logs and final output.
          </li>
        </ul>
      </DemoCard>

      <div className="demo-grid">
        <ValidationHarness
          title="Single Category Validation"
          description="Simpler app posture with only one Provider/Model for all invocations."
          appDefinition={defaultOnlyDefinition}
          categoryOptions={[]}
          gatewayConfig={gatewayConfig}
        />
        <ValidationHarness
          title="Categorized Operations Validation"
          description="Supports multiple categories allowing Provider/Model to be overridden for specific sets of operations."
          appDefinition={categorizedDefinition}
          categoryOptions={['evaluate', 'write']}
          gatewayConfig={gatewayConfig}
        />
      </div>
    </div>
  );
}
