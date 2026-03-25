'use client';

import React from 'react';

import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';
import { useAvailableProviders } from '../hooks/useAvailableProviders';

export function AIProviderSelector() {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const providers = useAvailableProviders();

  return (
    <label
      className="eg-ai-config-field eg-ai-config-provider-selector"
      data-eg-ai-config-field="provider"
    >
      Provider
      <select
        className="eg-ai-config-control"
        aria-label="AI provider"
        value={state.selectedProvider ?? ''}
        onChange={(event) =>
          actions.setProvider(
            event.target.value
              ? (event.target.value as never as Parameters<typeof actions.setProvider>[0])
              : null,
          )
        }
      >
        <option value="">Select a provider</option>
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.label}
          </option>
        ))}
      </select>
    </label>
  );
}
