import React, { useEffect, useMemo, useRef, useState } from 'react';

import { createAIConfigManager, sanitizeAIConfigForDebug } from '@evergraytech/ai-config';
import type {
  AIConfigAppDefinition,
  AIConfigManager,
  AIConfigState,
  AIHostedAuthRequest,
  AIHostedAuthResult,
  AIHostedGatewayError,
  AIHostedGatewayClient,
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
        body: request,
      });

      const response = await fetch(`${baseUrl}/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${request.token}`,
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
  const [isInvoking, setIsInvoking] = useState(false);
  const [stateSnapshot, setStateSnapshot] = useState<unknown>(null);
  const gatewayClientId = gatewayConfig.clientId;

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

  const manager = useMemo(() => {
    const nextManager = createAIConfigManager({
      appDefinition,
      hostedGateway: {
        clientId: gatewayClientId,
        gateway: createGatewayClient(gatewayConfig, appendLog),
      },
    });

    managerRef.current = nextManager;
    setStateSnapshot(sanitizeAIConfigForDebug(nextManager.getState()));
    return nextManager;
  }, [appDefinition, appendLog, gatewayClientId, gatewayConfig]);

  useEffect(() => {
    const unsubscribe = manager.subscribe((nextState: AIConfigState) => {
      const sanitized = sanitizeAIConfigForDebug(nextState);
      setStateSnapshot(sanitized);
      appendLog('config', 'state:changed', sanitized);
    });

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

    appendLog('invoke', 'invoke:request', {
      category: category ?? null,
      request,
      state: sanitizeAIConfigForDebug(effectiveManager.getState()),
    });

    setIsInvoking(true);
    setInvokeResult(null);

    try {
      const result = await effectiveManager.invoke(request);
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
        <AIConfigProvider appDefinition={appDefinition} manager={manager} loadOnMount={false}>
          <AIConfigPanel />
        </AIConfigProvider>

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
              Invoke default route
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

        <div className="demo-grid demo-grid--logs">
          <section className="demo-log-panel">
            <h4>Resolved ai-config state</h4>
            <pre>{JSON.stringify(stateSnapshot, null, 2)}</pre>
          </section>

          <section className="demo-log-panel">
            <h4>Latest invocation result</h4>
            <pre>{JSON.stringify(invokeResult, null, 2)}</pre>
          </section>
        </div>

        <section className="demo-log-panel">
          <h4>Gateway + invocation log</h4>
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
        providers: ['openai', 'anthropic', 'openrouter'],
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
        providers: ['openai', 'anthropic', 'openrouter'],
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
          title="Default-only route validation"
          description="Shows the simpler app posture with only the Default route active."
          appDefinition={defaultOnlyDefinition}
          categoryOptions={[]}
          gatewayConfig={gatewayConfig}
        />
        <ValidationHarness
          title="Categorized route validation"
          description="Shows category inheritance vs explicit overrides for evaluate and write flows."
          appDefinition={categorizedDefinition}
          categoryOptions={['evaluate', 'write']}
          gatewayConfig={gatewayConfig}
        />
      </div>
    </div>
  );
}
