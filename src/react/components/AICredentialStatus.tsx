'use client';

import React from 'react';

import { redactCredential } from '../../index';
import { useAIConfigState } from '../context/AIConfigContext';

export function AICredentialStatus() {
  const state = useAIConfigState();

  if (!state.selectedProvider) {
    return <p>No provider selected.</p>;
  }

  const credential = state.credentials[state.selectedProvider];

  if (!credential?.isPresent) {
    return <p>No saved API key for this provider.</p>;
  }

  return (
    <p>
      Saved key: <code>{redactCredential(credential.apiKey)}</code>
      {credential.validationState ? ` (${credential.validationState})` : ''}
    </p>
  );
}
