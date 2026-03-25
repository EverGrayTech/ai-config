'use client';

import React from 'react';

import { useAIConfigActions } from '../context/AIConfigContext';

export function AIConfigResetButton() {
  const actions = useAIConfigActions();

  return (
    <button type="button" onClick={() => actions.reset()}>
      Reset AI settings
    </button>
  );
}
