'use client';

import React from 'react';

import type { AIProviderId } from '../../index';
import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';
import { useAvailableProviders } from '../hooks/useAvailableProviders';

export interface AIProviderSelectorProps {
  routeKey?: 'default' | string;
  label?: string;
  ariaLabel?: string;
}

export function AIProviderSelector({
  routeKey = 'default',
  label = 'Provider',
  ariaLabel = 'AI provider',
}: AIProviderSelectorProps) {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const providers = useAvailableProviders();
  const selectedProvider =
    routeKey === 'default'
      ? state.selectedProvider
      : (state.routes?.categories?.[routeKey]?.provider ?? '');

  const nextProvider = (eventValue: string): AIProviderId | null =>
    eventValue ? (eventValue as AIProviderId) : null;

  return (
    <label
      className="eg-ai-config-field eg-ai-config-provider-selector"
      data-eg-ai-config-field="provider"
    >
      {label}
      <select
        className="eg-ai-config-control"
        aria-label={ariaLabel}
        value={selectedProvider ?? ''}
        onChange={(event) => {
          const provider = nextProvider(event.target.value);

          if (routeKey === 'default') {
            actions.setProvider(provider);
            return;
          }

          actions.setRouteProvider(routeKey, provider);
        }}
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
