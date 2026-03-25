'use client';

import React, { useState } from 'react';

import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';

export function AIApiKeyField() {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const [value, setValue] = useState('');
  const selectedProvider = state.selectedProvider;

  if (!selectedProvider || state.mode !== 'byok') {
    return null;
  }

  return (
    <div className="eg-ai-config-section eg-ai-config-api-key" data-eg-ai-config-section="api-key">
      <label className="eg-ai-config-field" htmlFor="ai-api-key">
        API key
      </label>
      <input
        className="eg-ai-config-control"
        id="ai-api-key"
        type="password"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-describedby="ai-api-key-help"
      />
      <div className="eg-ai-config-help-text" id="ai-api-key-help">
        Stored locally in your browser for this device.
      </div>
      <div className="eg-ai-config-actions" data-eg-ai-config-actions="api-key">
        <button
          className="eg-ai-config-button"
          type="button"
          onClick={() => actions.setCredential(selectedProvider, { apiKey: value })}
        >
          Save key
        </button>
        <button
          className="eg-ai-config-button eg-ai-config-button-secondary"
          type="button"
          onClick={() => actions.clearCredential(selectedProvider)}
        >
          Clear key
        </button>
      </div>
    </div>
  );
}
