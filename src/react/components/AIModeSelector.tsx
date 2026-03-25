'use client';

import React from 'react';

import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';

export function AIModeSelector() {
  const state = useAIConfigState();
  const actions = useAIConfigActions();

  return (
    <fieldset>
      <legend>AI mode</legend>
      <label>
        <input
          type="radio"
          name="ai-mode"
          checked={state.mode === 'default'}
          onChange={() => actions.setMode('default')}
        />
        Default app-provided mode
      </label>
      <label>
        <input
          type="radio"
          name="ai-mode"
          checked={state.mode === 'byok'}
          onChange={() => actions.setMode('byok')}
        />
        Bring your own key
      </label>
    </fieldset>
  );
}
