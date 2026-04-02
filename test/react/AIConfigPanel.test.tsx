import { render, screen } from '@testing-library/react';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { cleanup } from '@testing-library/react';
import { type AIConfigAppDefinition, createAIConfigManager } from '../../src';
import {
  AIConfigPanel,
  AIConfigProvider,
  AICredentialStatus,
  AIGenerationSettingsForm,
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
    providers: ['openai', 'anthropic'],
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

    expect(screen.getByText('AI mode')).toBeInTheDocument();
    expect(screen.getByLabelText('AI mode')).toBeInTheDocument();
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

    await user.selectOptions(screen.getByLabelText('AI mode'), 'byok');
    await user.selectOptions(screen.getByLabelText('AI provider'), 'openai');
    await user.selectOptions(screen.getByLabelText('AI model'), 'gpt-4.1-mini');

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

    await user.selectOptions(screen.getByLabelText('AI mode'), 'byok');
    await user.selectOptions(screen.getByLabelText('AI provider'), 'openai');
    await user.type(screen.getByLabelText('API key'), 'sk-test-1234567890');
    await user.click(screen.getByText('Save key'));

    expect(screen.getByText(/Saved key:/)).toBeInTheDocument();
    expect(screen.getByText(/Stored locally in your browser/)).toBeInTheDocument();

    await user.click(screen.getByText('Clear key'));
    expect(screen.getByText('No saved API key for this provider.')).toBeInTheDocument();
  });

  it('resets settings through the reset button', async () => {
    const user = userEvent.setup();

    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigPanel />
        <StateProbe />
      </AIConfigProvider>,
    );

    await user.selectOptions(screen.getByLabelText('AI mode'), 'byok');
    await user.selectOptions(screen.getByLabelText('AI provider'), 'anthropic');
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

    expect(screen.getByTestId('hook-provider-count')).toHaveTextContent('2');
    expect(screen.getByTestId('hook-model-count')).toHaveTextContent('0');
    expect(screen.getByTestId('hook-app-id')).toHaveTextContent('react-test-app');

    await user.click(screen.getByText('Hook set mode'));
    await user.selectOptions(screen.getByLabelText('AI mode'), 'byok');
    await user.selectOptions(screen.getByLabelText('AI provider'), 'openai');

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

    await user.selectOptions(screen.getByLabelText('AI mode'), 'byok');
    await user.selectOptions(screen.getByLabelText('AI provider'), 'openai');

    expect(events).toContain('byok:hosted');
    expect(events).toContain('byok:openai');
  });

  it('covers additional accessibility and conditional render states', async () => {
    const user = userEvent.setup();

    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AICredentialStatus />
        <AIUsageHint />
        <AIGenerationSettingsForm />
      </AIConfigProvider>,
    );

    expect(screen.getByText('No saved API key for this provider.')).toBeInTheDocument();
    expect(screen.getByText('App-provided AI')).toBeInTheDocument();

    const reasoningSelect = screen.getByLabelText('Reasoning preset');
    await user.selectOptions(reasoningSelect, 'high');
    expect((reasoningSelect as HTMLSelectElement).value).toBe('high');
    expect(screen.getByText('No saved API key for this provider.')).toHaveAttribute(
      'data-eg-ai-config-status',
      'missing',
    );
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

    await user.selectOptions(screen.getByLabelText('AI mode'), 'byok');
    expect(
      screen.getByLabelText('AI provider').closest('[data-eg-ai-config-field="provider"]'),
    ).not.toBeNull();
    expect(
      screen.getByLabelText('AI model').closest('[data-eg-ai-config-field="model"]'),
    ).not.toBeNull();
    expect(
      screen.getByText('Save key').closest('[data-eg-ai-config-actions="api-key"]'),
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

    await user.selectOptions(screen.getByLabelText('AI mode'), 'byok');
    expect(screen.getByText('Evaluate')).toBeInTheDocument();
    expect(screen.getByText('Write')).toBeInTheDocument();
    expect(screen.getAllByText('Uses Default route settings.')).toHaveLength(2);

    const evaluateSection = screen.getByText('Evaluate').closest('details');
    if (!evaluateSection) {
      throw new Error('Expected evaluate section');
    }

    await user.click(screen.getAllByText('Evaluate')[0]);
    await user.click(within(evaluateSection).getByLabelText('Enable category override'));

    expect(screen.getByLabelText('Evaluate provider')).toBeInTheDocument();
    expect(screen.getByLabelText('Evaluate model')).toBeInTheDocument();
    expect(screen.getByText('Evaluate generation settings')).toBeInTheDocument();
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

    await user.selectOptions(screen.getByLabelText('AI mode'), 'byok');
    await user.click(screen.getByText('Evaluate'));
    await user.click(screen.getByLabelText('Enable category override'));
    await user.selectOptions(screen.getByLabelText('Evaluate provider'), 'openai');
    await user.selectOptions(screen.getByLabelText('Evaluate model'), 'gpt-4.1-mini');
    await user.click(screen.getByText('Evaluate generation settings'));

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
});
