'use client';

import React from 'react';

import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';

export function AIModeSelector() {
  const state = useAIConfigState();
  const actions = useAIConfigActions();

  return (
    <fieldset
      className="eg-ai-config-section eg-ai-config-mode-selector"
      data-eg-ai-config-section="mode"
    >
      <legend>AI mode</legend>
      <label className="eg-ai-config-choice">
        <input
          type="radio"
          name="ai-mode"
          checked={state.mode === 'default'}
          onChange={() => actions.setMode('default')}
        />
        Default app-provided mode
      </label>
      <label className="eg-ai-config-choice">
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
