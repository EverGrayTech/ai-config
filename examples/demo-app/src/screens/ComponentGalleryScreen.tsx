import React from 'react';

import type { AIConfigAppDefinition } from '@evergraytech/ai-config';
import {
  AIApiKeyField,
  AIConfigProvider,
  AIConfigResetButton,
  AIConfigSettingsHeader,
  AIConfigSettingsSurface,
  AIConfigSetupRequired,
  AICredentialStatus,
  AIGenerationSettingsForm,
  AIModeSelector,
  AIModelSelector,
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
      <DemoCard
        title="Credential management"
        description="Switch to BYOK and select a provider to interact with the API key field."
      >
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
      <DemoCard title="Direct settings surface">
        <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
          <AIConfigSettingsSurface />
        </AIConfigProvider>
      </DemoCard>
      <DemoCard title="Composable settings primitives">
        <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
          <AIConfigSettingsHeader />
          <AIConfigSetupRequired
            requirement={{
              appId: appDefinition.appId,
              missingClientId: true,
              missingGatewayClient: true,
            }}
            config={{
              clientIdLabel: 'gateway client ID',
              clientIdValue: `${appDefinition.appId}-web`,
              gatewayLabel: 'hosted gateway adapter',
            }}
          />
        </AIConfigProvider>
      </DemoCard>
    </div>
  );
}
