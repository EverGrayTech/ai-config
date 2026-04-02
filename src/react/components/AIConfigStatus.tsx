'use client';

import React from 'react';

import { useAIConfigState } from '../context/AIConfigContext';

export function AIConfigStatus() {
  const state = useAIConfigState();

  if (state.mode !== 'byok') {
    return null;
  }

  if (!state.selectedProvider) {
    return (
      <p className="eg-ai-config-status" data-eg-ai-config-status="warning" role="status">
        Select a provider to configure bring-your-own-key access.
      </p>
    );
  }

  const credential = state.credentials[state.selectedProvider];
  const hasCredential = Boolean(credential?.isPresent && credential.apiKey);

  if (!hasCredential) {
    return (
      <p className="eg-ai-config-status" data-eg-ai-config-status="warning" role="alert">
        Add an API key before invoking this provider.
      </p>
    );
  }

  if (!state.selectedModel) {
    return (
      <p className="eg-ai-config-status" data-eg-ai-config-status="warning" role="alert">
        Select a model before invoking this provider.
      </p>
    );
  }

  return (
    <p className="eg-ai-config-status" data-eg-ai-config-status="ready" role="status">
      Provider, API key, and model are configured.
    </p>
  );
}
