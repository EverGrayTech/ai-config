'use client';

import React, { useEffect, useRef, useState } from 'react';

import { redactCredential } from '../../index';
import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';

export function AIApiKeyField() {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const [value, setValue] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedProvider = state.selectedProvider;
  const credential = selectedProvider ? state.credentials[selectedProvider] : undefined;
  const savedValue = credential?.apiKey;
  const hasSavedKey = Boolean(credential?.isPresent && savedValue);
  const placeholder = hasSavedKey ? (redactCredential(savedValue) ?? 'Saved key') : 'Specify the API key for the selected Provider';

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const persistValue = (nextValue: string) => {
    if (!selectedProvider) {
      return;
    }

    const trimmed = nextValue.trim();
    if (!trimmed || trimmed === savedValue) {
      return;
    }

    actions.setCredential(selectedProvider, { apiKey: trimmed });
  };

  const schedulePersist = (nextValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      persistValue(nextValue);
    }, 400);
  };

  if (!selectedProvider || state.mode !== 'byok') {
    return null;
  }

  return (
    <div className="eg-ai-config-section eg-ai-config-api-key" data-eg-ai-config-section="api-key">
      <input
        className="eg-ai-config-control"
        id="ai-api-key"
        type="password"
        value={value}
        placeholder={placeholder}
        aria-label="API key"
        onChange={(event) => {
          const nextValue = event.target.value;
          setValue(nextValue);
          schedulePersist(nextValue);
        }}
        onBlur={() => {
          persistValue(value);
          setValue('');
        }}
      />
      <div className="eg-ai-config-actions" data-eg-ai-config-actions="api-key">
        <button
          className="eg-ai-config-button eg-ai-config-button-secondary"
          type="button"
          title="Remove the saved API key from local storage on this device."
          onClick={() => {
            actions.clearCredential(selectedProvider);
            setValue('');
          }}
        >
          Clear key
        </button>
      </div>
    </div>
  );
}
