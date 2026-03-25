'use client';

import React from 'react';

import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';

export function AIGenerationSettingsForm() {
  const state = useAIConfigState();
  const actions = useAIConfigActions();

  return (
    <fieldset>
      <legend>Generation settings</legend>
      <label>
        Temperature
        <input
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={state.generation.temperature ?? ''}
          onChange={(event) => actions.updateGeneration({ temperature: Number(event.target.value) })}
        />
      </label>
      <label>
        Max output tokens
        <input
          type="number"
          min="1"
          step="1"
          value={state.generation.maxOutputTokens ?? ''}
          onChange={(event) => actions.updateGeneration({ maxOutputTokens: Number(event.target.value) })}
        />
      </label>
      <label>
        Reasoning preset
        <select
          aria-label="Reasoning preset"
          value={state.generation.reasoningPreset ?? ''}
          onChange={(event) =>
            actions.updateGeneration({
              reasoningPreset: event.target.value ? (event.target.value as 'low' | 'medium' | 'high') : undefined,
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
