'use client';

import React from 'react';

import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';
import { useAvailableModels } from '../hooks/useAvailableModels';

export function AIModelSelector() {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const models = useAvailableModels();

  return (
    <label className="eg-ai-config-field eg-ai-config-model-selector" data-eg-ai-config-field="model">
      Model
      <select
        className="eg-ai-config-control"
        aria-label="AI model"
        value={state.selectedModel ?? ''}
        onChange={(event) => actions.setModel(event.target.value || null)}
        disabled={!state.selectedProvider}
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
