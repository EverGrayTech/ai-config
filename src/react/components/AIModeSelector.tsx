'use client';

import React from 'react';

import {
  useAIConfigActions,
  useAIConfigAppDefinition,
  useAIConfigState,
} from '../context/AIConfigContext';

export function AIModeSelector() {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const appDefinition = useAIConfigAppDefinition();
  const defaultLabel = appDefinition.defaultMode?.label ?? 'App-provided AI';

  return (
    <label
      className="eg-ai-config-section eg-ai-config-mode-selector"
      data-eg-ai-config-section="mode"
    >
      <span>AI mode</span>
      <select
        className="eg-ai-config-control"
        aria-label="AI mode"
        value={state.mode}
        onChange={(event) => actions.setMode(event.target.value as 'default' | 'byok')}
      >
        <option value="default">{defaultLabel}</option>
        <option value="byok">Bring your own key</option>
      </select>
    </label>
  );
}
