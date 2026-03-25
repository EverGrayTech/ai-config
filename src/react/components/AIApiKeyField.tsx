'use client';

import React, { useState } from 'react';

import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';

export function AIApiKeyField() {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const [value, setValue] = useState('');

  if (!state.selectedProvider || state.mode !== 'byok') {
    return null;
  }

  return (
    <div>
      <label htmlFor="ai-api-key">API key</label>
      <input
        id="ai-api-key"
        type="password"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-describedby="ai-api-key-help"
      />
      <div id="ai-api-key-help">Stored locally in your browser for this device.</div>
      <button type="button" onClick={() => actions.setCredential(state.selectedProvider!, { apiKey: value })}>
        Save key
      </button>
      <button type="button" onClick={() => actions.clearCredential(state.selectedProvider!)}>
        Clear key
      </button>
    </div>
  );
}
