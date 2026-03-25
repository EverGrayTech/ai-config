'use client';

import React from 'react';

import { getAIUsagePresentation } from '../../index';
import { useAIConfigState } from '../context/AIConfigContext';

export function AIUsageHint() {
  const state = useAIConfigState();
  const usage = getAIUsagePresentation(state);

  return (
    <div className="eg-ai-config-usage-hint" data-eg-ai-config-section="usage" aria-live="polite">
      <strong className="eg-ai-config-usage-title">{usage.modeLabel}</strong>
      <p className="eg-ai-config-usage-copy">{usage.usageHint}</p>
      {usage.costHint ? <p className="eg-ai-config-usage-copy">{usage.costHint}</p> : null}
    </div>
  );
}
