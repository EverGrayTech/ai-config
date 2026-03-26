'use client';

import React from 'react';

import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';
import { useAvailableModels } from '../hooks/useAvailableModels';

export interface AIModelSelectorProps {
  routeKey?: 'default' | string;
  label?: string;
  ariaLabel?: string;
}

export function AIModelSelector({
  routeKey = 'default',
  label = 'Model',
  ariaLabel = 'AI model',
}: AIModelSelectorProps) {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const selectedProvider =
    routeKey === 'default'
      ? state.selectedProvider
      : (state.routes?.categories?.[routeKey]?.provider ?? null);
  const selectedModel =
    routeKey === 'default'
      ? state.selectedModel
      : (state.routes?.categories?.[routeKey]?.model ?? '');
  const models = useAvailableModels(routeKey);

  return (
    <label
      className="eg-ai-config-field eg-ai-config-model-selector"
      data-eg-ai-config-field="model"
    >
      {label}
      <select
        className="eg-ai-config-control"
        aria-label={ariaLabel}
        value={selectedModel ?? ''}
        onChange={(event) =>
          routeKey === 'default'
            ? actions.setModel(event.target.value || null)
            : actions.setRouteModel(routeKey, event.target.value || null)
        }
        disabled={!selectedProvider}
      >
        <option value="">Select a model</option>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
    </label>
  );
}
