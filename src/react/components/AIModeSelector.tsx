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

export interface AIModeSelectorProps {
  routeKey?: 'default' | string;
}

export function AIModeSelector({ routeKey = 'default' }: AIModeSelectorProps = {}) {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const appDefinition = useAIConfigAppDefinition();
  const providers = useAvailableProviders();
  const defaultLabel = appDefinition.defaultMode?.label ?? 'Free Trial';

  const providerOptions = [...providers].sort((left, right) =>
    left.label.localeCompare(right.label),
  );
  const categoryRoute = routeKey === 'default' ? null : state.routes?.categories?.[routeKey];
  const selectedValue =
    routeKey === 'default'
      ? state.mode === 'default'
        ? 'default'
        : (state.selectedProvider ?? '')
      : !categoryRoute?.enabled ||
          categoryRoute.provider == null ||
          categoryRoute.provider === 'hosted'
        ? 'default'
        : categoryRoute.provider;

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

          if (routeKey === 'default' && nextValue === 'default') {
            actions.setMode('default');
            return;
          }

          if (routeKey === 'default') {
            actions.setMode('byok');
            actions.setProvider((nextValue as AIProviderId) || null);
            return;
          }

          if (nextValue === 'default') {
            actions.setCategoryEnabled(routeKey, true);
            actions.setRouteProvider(routeKey, 'hosted');
            return;
          }

          actions.setCategoryEnabled(routeKey, true);
          actions.setRouteProvider(routeKey, (nextValue as AIProviderId) || null);
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
