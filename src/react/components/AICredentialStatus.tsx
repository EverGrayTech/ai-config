'use client';

import React from 'react';

import { redactCredential } from '../../index';
import { useAIConfigState } from '../context/AIConfigContext';

export function AICredentialStatus() {
  const state = useAIConfigState();

  if (!state.selectedProvider) {
    return <p className="eg-ai-config-status" data-eg-ai-config-status="empty">No provider selected.</p>;
  }

  const credential = state.credentials[state.selectedProvider];

  if (!credential?.isPresent) {
    return <p className="eg-ai-config-status" data-eg-ai-config-status="missing">No saved API key for this provider.</p>;
  }

  return (
    <p className="eg-ai-config-status" data-eg-ai-config-status="saved">
      Saved key: <code>{redactCredential(credential.apiKey)}</code>
      {credential.validationState ? ` (${credential.validationState})` : ''}
    </p>
  );
}
