'use client';

import React from 'react';

import { AIApiKeyField } from './AIApiKeyField';
import { AICredentialStatus } from './AICredentialStatus';
import { AIConfigResetButton } from './AIConfigResetButton';
import { AIGenerationSettingsForm } from './AIGenerationSettingsForm';
import { AIModelSelector } from './AIModelSelector';
import { AIModeSelector } from './AIModeSelector';
import { AIProviderSelector } from './AIProviderSelector';
import { AIUsageHint } from './AIUsageHint';

export function AIConfigPanel() {
  return (
    <section aria-label="AI configuration panel">
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
