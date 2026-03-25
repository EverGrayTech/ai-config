'use client';

import React from 'react';

import { AIApiKeyField } from './AIApiKeyField';
import { AIConfigResetButton } from './AIConfigResetButton';
import { AICredentialStatus } from './AICredentialStatus';
import { AIGenerationSettingsForm } from './AIGenerationSettingsForm';
import { AIModeSelector } from './AIModeSelector';
import { AIModelSelector } from './AIModelSelector';
import { AIProviderSelector } from './AIProviderSelector';
import { AIUsageHint } from './AIUsageHint';

export function AIConfigPanel() {
  return (
    <section
      aria-label="AI configuration panel"
      className="eg-ai-config-panel"
      data-eg-ai-config-panel="true"
    >
      <AIModeSelector />
      <AIProviderSelector />
      <AIModelSelector />
      <AIApiKeyField />
      <AICredentialStatus />
      <AIGenerationSettingsForm />
      <AIUsageHint />
      <AIConfigResetButton />
    </section>
  );
}
