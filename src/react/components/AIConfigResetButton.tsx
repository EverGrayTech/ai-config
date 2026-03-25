'use client';

import React from 'react';

import { useAIConfigActions } from '../context/AIConfigContext';

export function AIConfigResetButton() {
  const actions = useAIConfigActions();

  return (
    <button className="eg-ai-config-button eg-ai-config-reset-button" data-eg-ai-config-action="reset" type="button" onClick={() => actions.reset()}>
      Reset AI settings
    </button>
  );
}
