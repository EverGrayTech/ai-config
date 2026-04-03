'use client';

import React from 'react';

import type { AIProviderId } from '../../index';
import { useAIConfigState } from '../context/AIConfigContext';

export interface AIConfigStatusProps {
  provider?: AIProviderId | null;
  model?: string | null;
  visible?: boolean;
}

export function AIConfigStatus({ provider, model, visible = true }: AIConfigStatusProps = {}) {
  const state = useAIConfigState();

  if (!visible) {
    return null;
  }

  const selectedProvider = provider ?? state.selectedProvider;
  const selectedModel = model ?? state.selectedModel;

  if (!selectedProvider) {
    return (
      <output className="eg-ai-config-status" data-eg-ai-config-status="warning">
        Select a provider to configure bring-your-own-key access.
      </output>
    );
  }

  const credential = state.credentials[selectedProvider];
  const hasCredential = Boolean(credential?.isPresent && credential.apiKey);

  if (!hasCredential) {
    return (
      <p className="eg-ai-config-status" data-eg-ai-config-status="warning" role="alert">
        Add an API key before invoking this provider.
      </p>
    );
  }

  if (!selectedModel) {
    return (
      <p className="eg-ai-config-status" data-eg-ai-config-status="warning" role="alert">
        Select a model before invoking this provider.
      </p>
    );
  }

  return (
    <output className="eg-ai-config-status" data-eg-ai-config-status="ready">
      Provider, API key, and model are configured.
    </output>
  );
}
