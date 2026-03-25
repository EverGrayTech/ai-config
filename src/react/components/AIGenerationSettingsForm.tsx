'use client';

import React from 'react';

import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';

export function AIGenerationSettingsForm() {
  const state = useAIConfigState();
  const actions = useAIConfigActions();

  return (
    <fieldset
      className="eg-ai-config-section eg-ai-config-generation-settings"
      data-eg-ai-config-section="generation"
    >
      <legend>Generation settings</legend>
      <label className="eg-ai-config-field">
        Temperature
        <input
          className="eg-ai-config-control"
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={state.generation.temperature ?? ''}
          onChange={(event) =>
            actions.updateGeneration({ temperature: Number(event.target.value) })
          }
        />
      </label>
      <label className="eg-ai-config-field">
        Max output tokens
        <input
          className="eg-ai-config-control"
          type="number"
          min="1"
          step="1"
          value={state.generation.maxOutputTokens ?? ''}
          onChange={(event) =>
            actions.updateGeneration({ maxOutputTokens: Number(event.target.value) })
          }
        />
      </label>
      <label className="eg-ai-config-field">
        Reasoning preset
        <select
          className="eg-ai-config-control"
          aria-label="Reasoning preset"
          value={state.generation.reasoningPreset ?? ''}
          onChange={(event) =>
            actions.updateGeneration({
              reasoningPreset: event.target.value
                ? (event.target.value as 'low' | 'medium' | 'high')
                : undefined,
            })
          }
        >
          <option value="">Default</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
    </fieldset>
  );
}
