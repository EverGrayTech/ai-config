import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { createAIConfigManager, type AIConfigAppDefinition } from '../../src';
import {
  AIConfigPanel,
  AIConfigProvider,
  useAIConfig,
  useAIConfigActions,
  useAIConfigAppDefinition,
  useAIConfigState,
  useAvailableModels,
  useAvailableProviders,
} from '../../src/react';
import { cleanup } from '@testing-library/react';

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
    expect(screen.getByLabelText('AI provider')).toBeInTheDocument();
    expect(screen.getByLabelText('AI model')).toBeInTheDocument();
    expect(screen.getByText('Generation settings')).toBeInTheDocument();
  });

  it('updates mode, provider, model, and generation settings through interactions', async () => {
    const user = userEvent.setup();

    render(
      <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
        <AIConfigPanel />
        <StateProbe />
      </AIConfigProvider>,
    );

    await user.click(screen.getByLabelText('Bring your own key'));
    await user.selectOptions(screen.getByLabelText('AI provider'), 'openai');
    await user.selectOptions(screen.getByLabelText('AI model'), 'gpt-4.1-mini');

    const temperatureInput = screen.getByLabelText('Temperature');
    await user.clear(temperatureInput);
    await user.type(temperatureInput, '0.9');

    expect(screen.getByTestId('state-probe').textContent).toContain('"mode":"byok"');
    expect(screen.getByTestId('state-probe').textContent).toContain('"selectedProvider":"openai"');
    expect(screen.getByTestId('state-probe').textContent).toContain('"selectedModel":"gpt-4.1-mini"');
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

    await user.click(screen.getByLabelText('Bring your own key'));
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

    await user.click(screen.getByLabelText('Bring your own key'));
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

    expect(screen.getByLabelText('AI provider')).toBeInTheDocument();
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
    await user.selectOptions(screen.getByLabelText('AI provider'), 'openai');

    expect(screen.getByTestId('hook-model-count')).toHaveTextContent('2');
    expect(screen.getByTestId('hook-manager-mode')).toHaveTextContent('byok');
  });
});
