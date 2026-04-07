import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { type AIConfigAppDefinition, createAIConfigManager } from '../../src';
import {
  AIConfigPanel,
  AIConfigProvider,
  AIConfigSettingsHeader,
  AIConfigSettingsSurface,
  AIConfigSetupRequired,
  AIConfigStatus,
  AICredentialStatus,
  AIGenerationSettingsForm,
  AIProviderSelector,
  AIUsageHint,
  useAIConfig,
  useAIConfigActions,
  useAIConfigAppDefinition,
  useAIConfigState,
  useAvailableModels,
  useAvailableProviders,
} from '../../src/react';

afterEach(() => {
  cleanup();
});

const appDefinition: AIConfigAppDefinition = {
  appId: 'react-test-app',
  defaultMode: {
    enabled: true,
    label: 'Hosted mode',
    provider: 'hosted',
    model: 'hosted-model',
    usageHint: 'Hosted usage available.',
  },
  byok: {
    enabled: true,
    providers: ['anthropic', 'gemini', 'openai'],
  },
  defaultGeneration: {
    temperature: 0.4,
    maxOutputTokens: 500,
  },
};

function StateProbe() {
  const state = useAIConfigState();

  return <output data-testid="state-probe">{JSON.stringify(state)}</output>;
}

function HookProbe() {
  const { manager } = useAIConfig();
  const actions = useAIConfigActions();
  const appDefinitionFromContext = useAIConfigAppDefinition();
  const providers = useAvailableProviders();
  const models = useAvailableModels();

  return (
    <div>
      <output data-testid="hook-provider-count">{providers.length}</output>
      <output data-testid="hook-model-count">{models.length}</output>
      <output data-testid="hook-app-id">{appDefinitionFromContext.appId}</output>
      <button type="button" onClick={() => actions.setMode('byok')}>
        Hook set mode
      </button>
      <button type="button" onClick={() => actions.save()}>
        Hook save
      </button>
      <output data-testid="hook-manager-mode">{manager.getState().mode}</output>
    </div>
  );
}

describe('AIConfigPanel', () => {
  it('renders the main settings controls', () => {
    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigPanel />
      </AIConfigProvider>,
    );

    expect(screen.getByText('AI Provider')).toBeInTheDocument();
    expect(screen.getByLabelText('AI Provider')).toBeInTheDocument();
    expect(screen.queryByLabelText('AI provider')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('AI model')).not.toBeInTheDocument();
    expect(screen.getByText('Generation settings')).toBeInTheDocument();
    expect(screen.getByLabelText('AI configuration panel')).toHaveClass('eg-ai-config-panel');
    expect(screen.getByLabelText('AI configuration panel')).toHaveAttribute(
      'data-eg-ai-config-framed',
      'false',
    );
  });

  it('supports optional package-provided framing when requested', () => {
    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigPanel framed />
      </AIConfigProvider>,
    );

    expect(screen.getByLabelText('AI configuration panel')).toHaveAttribute(
      'data-eg-ai-config-framed',
      'true',
    );
  });

  it('updates mode, provider, model, and generation settings through interactions', async () => {
    const user = userEvent.setup();

    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigPanel />
        <StateProbe />
      </AIConfigProvider>,
    );

    await user.selectOptions(screen.getByLabelText('AI Provider'), 'openai');
    await user.selectOptions(screen.getByLabelText('Model'), 'gpt-4.1-mini');

    const temperatureInput = screen.getByLabelText('Temperature');
    await user.clear(temperatureInput);
    await user.type(temperatureInput, '0.9');

    expect(screen.getByTestId('state-probe').textContent).toContain('"mode":"byok"');
    expect(screen.getByTestId('state-probe').textContent).toContain('"selectedProvider":"openai"');
    expect(screen.getByTestId('state-probe').textContent).toContain(
      '"selectedModel":"gpt-4.1-mini"',
    );
    expect(screen.getByTestId('state-probe').textContent).toContain('"temperature":0.9');
  });

  it('saves and clears API keys accessibly', async () => {
    const user = userEvent.setup();

    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigPanel />
        <StateProbe />
      </AIConfigProvider>,
    );

    await user.selectOptions(screen.getByLabelText('AI Provider'), 'openai');
    await user.type(screen.getByLabelText('API key'), 'sk-test-1234567890');

    expect(screen.getByText('Add an API key before invoking this provider.')).toBeInTheDocument();

    expect(screen.getByLabelText('AI Provider')).toHaveValue('openai');

    await user.click(screen.getByText('Clear key'));
    expect(screen.getByLabelText('API key')).toHaveValue('');
  });

  it('resets settings through the reset button', async () => {
    const user = userEvent.setup();

    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigPanel />
        <StateProbe />
      </AIConfigProvider>,
    );

    await user.selectOptions(screen.getByLabelText('AI Provider'), 'anthropic');
    await user.click(screen.getByText('Reset AI settings'));

    expect(screen.getByTestId('state-probe').textContent).toContain('"mode":"default"');
    expect(screen.getByTestId('state-probe').textContent).toContain('"selectedProvider":"hosted"');
  });

  it('supports externally provided manager instances', () => {
    const manager = createAIConfigManager({ appDefinition });

    render(
      <AIConfigProvider appDefinition={appDefinition} manager={manager} loadOnMount={false}>
        <AIConfigPanel />
      </AIConfigProvider>,
    );

    expect(screen.queryByLabelText('AI provider')).not.toBeInTheDocument();
  });

  it('exposes react hooks and context helpers', async () => {
    const user = userEvent.setup();

    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigPanel />
        <HookProbe />
        <StateProbe />
      </AIConfigProvider>,
    );

    expect(screen.getByTestId('hook-provider-count')).toHaveTextContent('3');
    expect(screen.getByTestId('hook-model-count')).toHaveTextContent('0');
    expect(screen.getByTestId('hook-app-id')).toHaveTextContent('react-test-app');

    await user.click(screen.getByText('Hook set mode'));
    await user.selectOptions(screen.getByLabelText('AI Provider'), 'openai');

    expect(screen.getByTestId('hook-model-count')).toHaveTextContent('2');
    expect(screen.getByTestId('hook-manager-mode')).toHaveTextContent('byok');
  });

  it('notifies hosts about config changes through provider onChange', async () => {
    const user = userEvent.setup();
    const events: string[] = [];

    render(
      <AIConfigProvider
        appDefinition={appDefinition}
        loadOnMount={false}
        onChange={(event) =>
          events.push(`${event.nextState.mode}:${event.nextState.selectedProvider ?? 'none'}`)
        }
      >
        <AIConfigPanel />
      </AIConfigProvider>,
    );

    await user.selectOptions(screen.getByLabelText('AI Provider'), 'openai');

    expect(events).toContain('byok:hosted');
    expect(events).toContain('byok:openai');
  });

  it('covers additional accessibility and conditional render states', async () => {
    const user = userEvent.setup();

    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIUsageHint />
        <AIGenerationSettingsForm />
      </AIConfigProvider>,
    );

    expect(screen.getByText('Free Trial')).toBeInTheDocument();

    const reasoningSelect = screen.getByLabelText('Reasoning preset');
    await user.selectOptions(reasoningSelect, 'high');
    expect((reasoningSelect as HTMLSelectElement).value).toBe('high');

    const byokUsageManager = createAIConfigManager({ appDefinition });
    byokUsageManager.setMode('byok');
    byokUsageManager.setProvider('openai');

    const usageView = render(
      <AIConfigProvider
        appDefinition={appDefinition}
        manager={byokUsageManager}
        loadOnMount={false}
      >
        <AIUsageHint />
      </AIConfigProvider>,
    );

    expect(usageView.getByText('Bring your own key')).toBeInTheDocument();
    usageView.unmount();

    const statusView = render(
      <AIConfigProvider
        appDefinition={appDefinition}
        manager={byokUsageManager}
        loadOnMount={false}
      >
        <AIConfigStatus />
      </AIConfigProvider>,
    );

    expect(
      statusView.getByText('Add an API key before invoking this provider.'),
    ).toBeInTheDocument();
    statusView.unmount();
  });

  it('renders credential status for empty, missing, and saved states', async () => {
    const user = userEvent.setup();

    const savedKeyManager = createAIConfigManager({ appDefinition });
    savedKeyManager.setMode('byok');
    savedKeyManager.setProvider('openai');
    savedKeyManager.setCredential('openai', { apiKey: 'sk-test-1234567890' });

    const missingKeyManager = createAIConfigManager({ appDefinition });
    missingKeyManager.setMode('byok');
    missingKeyManager.setProvider('openai');

    const emptyStatus = render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AICredentialStatus />
      </AIConfigProvider>,
    );

    expect(emptyStatus.getByText('No saved API key for this provider.')).toHaveAttribute(
      'data-eg-ai-config-status',
      'missing',
    );
    emptyStatus.unmount();

    const missingStatus = render(
      <AIConfigProvider
        appDefinition={appDefinition}
        manager={missingKeyManager}
        loadOnMount={false}
      >
        <AICredentialStatus />
      </AIConfigProvider>,
    );

    expect(missingStatus.getByText('No saved API key for this provider.')).toHaveAttribute(
      'data-eg-ai-config-status',
      'missing',
    );
    missingStatus.unmount();

    const savedStatus = render(
      <AIConfigProvider appDefinition={appDefinition} manager={savedKeyManager} loadOnMount={false}>
        <AICredentialStatus />
      </AIConfigProvider>,
    );

    expect(savedStatus.getByText(/Saved key:/)).toHaveAttribute(
      'data-eg-ai-config-status',
      'saved',
    );
    expect(savedStatus.getByText('sk-t••••7890')).toBeInTheDocument();
    savedStatus.unmount();

    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigPanel />
      </AIConfigProvider>,
    );

    await user.selectOptions(screen.getByLabelText('AI Provider'), 'openai');
    await user.type(screen.getByLabelText('API key'), 'sk-fresh-123456');
    await user.tab();

    expect(screen.getByRole('option', { name: /OpenAI — configured/ })).toBeInTheDocument();
  });

  it('exposes stable styling hooks for key sections and actions', async () => {
    const user = userEvent.setup();

    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigPanel />
      </AIConfigProvider>,
    );

    expect(screen.getByText('Reset AI settings')).toHaveAttribute(
      'data-eg-ai-config-action',
      'reset',
    );

    await user.selectOptions(screen.getByLabelText('AI Provider'), 'openai');
    expect(screen.queryByLabelText('AI provider')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('Model').closest('[data-eg-ai-config-field="model"]'),
    ).not.toBeNull();
    expect(
      screen.getByText('Clear key').closest('[data-eg-ai-config-actions="api-key"]'),
    ).not.toBeNull();
  });

  it('shows only default route controls when no categories are declared', () => {
    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigPanel />
      </AIConfigProvider>,
    );

    expect(screen.queryByLabelText('AI provider')).not.toBeInTheDocument();
    expect(screen.queryByText('Enable category override')).not.toBeInTheDocument();
    expect(screen.getByText('Generation settings')).toBeInTheDocument();
  });

  it('renders categorized route controls with collapsible overrides', async () => {
    const user = userEvent.setup();
    const categorizedAppDefinition: AIConfigAppDefinition = {
      ...appDefinition,
      operationCategories: [
        { key: 'evaluate', label: 'Evaluate', description: 'Evaluation tasks' },
        { key: 'write', label: 'Write' },
      ],
    };

    render(
      <AIConfigProvider appDefinition={categorizedAppDefinition} loadOnMount={false}>
        <AIConfigPanel />
        <StateProbe />
      </AIConfigProvider>,
    );

    await user.selectOptions(screen.getByLabelText('AI Provider'), 'openai');
    expect(screen.getByText('Evaluate')).toBeInTheDocument();
    expect(screen.getByText('Write')).toBeInTheDocument();
    expect(screen.getAllByText('Uses Default settings until enabled.')).toHaveLength(2);

    const evaluateSection = screen.getByText('Evaluate').closest('details');
    if (!evaluateSection) {
      throw new Error('Expected evaluate section');
    }

    await user.click(screen.getAllByText('Evaluate')[0]);
    await user.click(within(evaluateSection).getByLabelText('Enable category override'));

    expect(screen.getAllByLabelText('AI Provider')[1]).toHaveValue('default');
    expect(screen.queryByLabelText('evaluate provider')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('evaluate model')).not.toBeInTheDocument();
    expect(within(evaluateSection).getByText('Generation settings')).toBeInTheDocument();
  });

  it('updates category-specific provider, model, and generation settings', async () => {
    const user = userEvent.setup();
    const categorizedAppDefinition: AIConfigAppDefinition = {
      ...appDefinition,
      operationCategories: [{ key: 'evaluate', label: 'Evaluate' }],
    };

    render(
      <AIConfigProvider appDefinition={categorizedAppDefinition} loadOnMount={false}>
        <AIConfigPanel />
        <StateProbe />
      </AIConfigProvider>,
    );

    await user.selectOptions(screen.getByLabelText('AI Provider'), 'openai');
    await user.click(screen.getByText('Evaluate'));
    await user.click(screen.getByLabelText('Enable category override'));
    expect(screen.getAllByLabelText('AI Provider')[1]).toHaveValue('default');
    await user.selectOptions(screen.getAllByLabelText('AI Provider')[1], 'openai');
    await user.selectOptions(screen.getByLabelText('evaluate model'), 'gpt-4.1-mini');
    const tempInputs = screen.getAllByLabelText('Temperature');
    const evaluateTemperature = tempInputs[tempInputs.length - 1];
    await user.clear(evaluateTemperature);
    await user.type(evaluateTemperature, '1.1');

    const stateText = screen.getByTestId('state-probe').textContent ?? '';
    expect(stateText).toContain('"evaluate":{"enabled":true');
    expect(stateText).toContain('"provider":"openai"');
    expect(stateText).toContain('"model":"gpt-4.1-mini"');
    expect(stateText).toContain('"temperature":1.1');
  });

  it('keeps category override enabled and hides provider/model-specific controls when Free Trial is selected', async () => {
    const user = userEvent.setup();
    const categorizedAppDefinition: AIConfigAppDefinition = {
      ...appDefinition,
      operationCategories: [{ key: 'evaluate', label: 'Evaluate' }],
    };

    render(
      <AIConfigProvider appDefinition={categorizedAppDefinition} loadOnMount={false}>
        <AIConfigPanel />
        <StateProbe />
      </AIConfigProvider>,
    );

    await user.click(screen.getByText('Evaluate'));
    await user.click(screen.getByLabelText('Enable category override'));

    const categoryProviderSelect = screen.getAllByLabelText('AI Provider')[1];
    expect(categoryProviderSelect).toHaveValue('default');
    expect(screen.queryByLabelText('evaluate provider')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('evaluate model')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('API key')).not.toBeInTheDocument();

    await user.selectOptions(categoryProviderSelect, 'openai');
    expect(screen.getByLabelText('evaluate model')).toBeInTheDocument();

    await user.selectOptions(screen.getAllByLabelText('AI Provider')[1], 'default');

    const stateText = screen.getByTestId('state-probe').textContent ?? '';
    expect(stateText).toContain('"evaluate":{"enabled":true');
    expect(stateText).toContain('"provider":"hosted"');
    expect(screen.getAllByLabelText('AI Provider')[1]).toHaveValue('default');
    expect(screen.queryByLabelText('evaluate provider')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('evaluate model')).not.toBeInTheDocument();
  });

  it('allows provider selection with package defaults when appDefinition omits defaultMode and byok', async () => {
    const user = userEvent.setup();
    const minimalDefinition: AIConfigAppDefinition = {
      appId: 'minimal-defaults-test',
      operationCategories: [{ key: 'evaluate', label: 'Evaluate' }],
    };

    render(
      <AIConfigProvider appDefinition={minimalDefinition} loadOnMount={false}>
        <AIConfigPanel />
        <StateProbe />
      </AIConfigProvider>,
    );

    await user.selectOptions(screen.getByLabelText('AI Provider'), 'openai');
    expect(screen.getByLabelText('AI Provider')).toHaveValue('openai');
    expect(screen.getByRole('option', { name: 'OpenRouter' })).toBeInTheDocument();
    expect(screen.getByLabelText('Model')).toBeInTheDocument();

    await user.click(screen.getByText('Evaluate'));
    await user.click(screen.getByLabelText('Enable category override'));
    await user.selectOptions(screen.getAllByLabelText('AI Provider')[1], 'openai');

    const stateText = screen.getByTestId('state-probe').textContent ?? '';
    expect(stateText).toContain('"selectedProvider":"openai"');
    expect(stateText).toContain('"evaluate":{"enabled":true,"provider":"openai"');
    expect(screen.getAllByLabelText('AI Provider')[1]).toHaveValue('openai');
  });

  it('renders settings header defaults and custom copy', () => {
    const { rerender } = render(<AIConfigSettingsHeader />);

    expect(screen.getByText('AI settings')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Choose whether to use app-provided AI or configure your own provider and model.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'AI settings' })).toBeInTheDocument();

    rerender(<AIConfigSettingsHeader title="Custom title" description="Custom description" />);

    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });

  it('renders setup required messaging for missing hosted configuration states', () => {
    const { rerender } = render(
      <AIConfigSetupRequired
        requirement={{
          appId: 'demo-app',
          missingClientId: true,
          missingGatewayClient: true,
        }}
      />,
    );

    expect(screen.getByLabelText('AI setup required')).toBeInTheDocument();
    expect(
      screen.getByText('Missing configuration: client ID and gateway client.'),
    ).toBeInTheDocument();

    rerender(
      <AIConfigSetupRequired
        requirement={{
          appId: 'demo-app',
          missingClientId: true,
          missingGatewayClient: false,
        }}
        config={{ clientIdLabel: 'App client ID', clientIdValue: 'evergray-demo' }}
      />,
    );

    expect(screen.getByText('Missing configuration: App client ID.')).toBeInTheDocument();
    expect(screen.getByText('Expected App client ID:')).toBeInTheDocument();
    expect(screen.getByText('evergray-demo')).toBeInTheDocument();

    rerender(
      <AIConfigSetupRequired
        requirement={{
          appId: 'demo-app',
          missingClientId: false,
          missingGatewayClient: false,
        }}
      />,
    );

    expect(screen.queryByLabelText('AI setup required')).not.toBeInTheDocument();
  });

  it('renders settings surface with setup-required and panel states', () => {
    const { rerender } = render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigSettingsSurface
          framed
          title="Surface title"
          description="Surface description"
          setupMessageConfig={{
            clientIdLabel: 'Hosted client ID',
            gatewayLabel: 'Hosted gateway',
            clientIdValue: 'surface-app',
          }}
        />
      </AIConfigProvider>,
    );

    const surface = screen.getByLabelText('AI settings');
    expect(surface).toHaveAttribute('data-eg-ai-config-surface', 'true');
    expect(surface).toHaveAttribute('data-eg-ai-config-framed', 'true');
    expect(screen.getByText('Surface title')).toBeInTheDocument();
    expect(screen.getByText('Surface description')).toBeInTheDocument();
    expect(screen.getByLabelText('AI setup required')).toBeInTheDocument();
    expect(
      screen.getByText('Missing configuration: Hosted client ID and Hosted gateway.'),
    ).toBeInTheDocument();

    rerender(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigSettingsSurface
          managerOptions={{
            hostedGateway: {
              clientId: 'client',
              gateway: {
                authenticate: async () => ({ ok: true, token: 'token', expiresAt: '2099-01-01' }),
                invoke: async () => ({
                  ok: true,
                  provider: 'hosted',
                  model: 'hosted-model',
                  output: 'ok',
                  executionPath: 'hosted',
                }),
              },
            },
          }}
        />
      </AIConfigProvider>,
    );

    expect(screen.queryByLabelText('AI setup required')).not.toBeInTheDocument();
    expect(screen.getByLabelText('AI configuration panel')).toBeInTheDocument();
  });

  it('renders provider selector defaults and updates default plus route providers', async () => {
    const user = userEvent.setup();
    const categorizedAppDefinition: AIConfigAppDefinition = {
      ...appDefinition,
      operationCategories: [{ key: 'evaluate', label: 'Evaluate' }],
    };

    const byokManager = createAIConfigManager({ appDefinition: categorizedAppDefinition });
    byokManager.setMode('byok');

    const { rerender } = render(
      <AIConfigProvider appDefinition={categorizedAppDefinition} loadOnMount={false}>
        <AIProviderSelector />
        <StateProbe />
      </AIConfigProvider>,
    );

    expect(screen.getByLabelText('AI provider')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Select a provider' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'OpenAI' })).toBeInTheDocument();

    rerender(
      <AIConfigProvider
        appDefinition={categorizedAppDefinition}
        manager={byokManager}
        loadOnMount={false}
      >
        <AIProviderSelector />
        <StateProbe />
      </AIConfigProvider>,
    );

    await user.selectOptions(screen.getByLabelText('AI provider'), 'openai');
    expect(screen.getByTestId('state-probe').textContent).toContain('"selectedProvider":"openai"');

    rerender(
      <AIConfigProvider
        appDefinition={categorizedAppDefinition}
        manager={byokManager}
        loadOnMount={false}
      >
        <AIProviderSelector
          routeKey="evaluate"
          label="Category provider"
          ariaLabel="category provider"
        />
        <StateProbe />
      </AIConfigProvider>,
    );

    const categorySelect = screen.getByLabelText('category provider');
    expect(categorySelect).toHaveValue('');

    await user.selectOptions(categorySelect, 'anthropic');

    const stateText = screen.getByTestId('state-probe').textContent ?? '';
    expect(stateText).toContain('"evaluate":{"enabled":false,"provider":"anthropic"');
  });
});
