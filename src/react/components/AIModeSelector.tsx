'use client';

import React from 'react';

import type { AIProviderId } from '../../index';
import { isProviderConfigured } from '../../index';
import {
  useAIConfigActions,
  useAIConfigAppDefinition,
  useAIConfigState,
} from '../context/AIConfigContext';
import { useAvailableProviders } from '../hooks/useAvailableProviders';

export function AIModeSelector() {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const appDefinition = useAIConfigAppDefinition();
  const providers = useAvailableProviders();
  const defaultLabel = appDefinition.defaultMode?.label ?? 'App-provided AI';

  const providerOptions = [...providers].sort((left, right) =>
    left.label.localeCompare(right.label),
  );
  const selectedValue = state.mode === 'default' ? 'default' : (state.selectedProvider ?? '');

  return (
    <label
      className="eg-ai-config-section eg-ai-config-mode-selector"
      data-eg-ai-config-section="mode"
    >
      <span>AI Provider</span>
      <select
        className="eg-ai-config-control"
        aria-label="AI Provider"
        value={selectedValue}
        onChange={(event) => {
          const nextValue = event.target.value;

          if (nextValue === 'default') {
            actions.setMode('default');
            return;
          }

          actions.setMode('byok');
          actions.setProvider((nextValue as AIProviderId) || null);
        }}
      >
        <option value="default">{defaultLabel}</option>
        {providerOptions.map((provider) => {
          const configured = isProviderConfigured(state, provider.id);
          const label = configured ? `${provider.label} — configured` : provider.label;

          return (
            <option key={provider.id} value={provider.id}>
              {label}
            </option>
          );
        })}
      </select>
    </label>
  );
}
