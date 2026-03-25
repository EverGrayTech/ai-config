'use client';

import React from 'react';

import { getAIUsagePresentation } from '../../index';
import { useAIConfigState } from '../context/AIConfigContext';

export function AIUsageHint() {
  const state = useAIConfigState();
  const usage = getAIUsagePresentation(state);

  return (
    <div aria-live="polite">
      <strong>{usage.modeLabel}</strong>
      <p>{usage.usageHint}</p>
      {usage.costHint ? <p>{usage.costHint}</p> : null}
    </div>
  );
}
