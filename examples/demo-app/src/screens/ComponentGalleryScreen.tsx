import React from 'react';

import { type AIConfigAppDefinition } from '@evergraytech/ai-config';
import {
  AIApiKeyField,
  AICredentialStatus,
  AIGenerationSettingsForm,
  AIConfigProvider,
  AIConfigResetButton,
  AIModelSelector,
  AIModeSelector,
  AIProviderSelector,
  AIUsageHint,
} from '@evergraytech/ai-config/react';

import { DemoCard } from '../components/DemoCard';

type ComponentGalleryScreenProps = {
  appDefinition: AIConfigAppDefinition;
};

export function ComponentGalleryScreen({ appDefinition }: ComponentGalleryScreenProps) {
  return (
    <div className="demo-grid">
      <DemoCard title="Mode selector">
        <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
          <AIModeSelector />
        </AIConfigProvider>
      </DemoCard>
      <DemoCard title="Provider + model selectors">
        <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
          <AIProviderSelector />
          <AIModelSelector />
        </AIConfigProvider>
      </DemoCard>
      <DemoCard title="Generation settings">
        <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
          <AIGenerationSettingsForm />
        </AIConfigProvider>
      </DemoCard>
      <DemoCard title="Credential management" description="Switch to BYOK and select a provider to interact with the API key field.">
        <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
          <AIModeSelector />
          <AIProviderSelector />
          <AIApiKeyField />
          <AICredentialStatus />
        </AIConfigProvider>
      </DemoCard>
      <DemoCard title="Usage hint + reset">
        <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
          <AIUsageHint />
          <AIConfigResetButton />
        </AIConfigProvider>
      </DemoCard>
    </div>
  );
}
