import React from 'react';

import { type AIConfigAppDefinition, createAIConfigManager } from '@evergraytech/ai-config';
import { AIConfigPanel, AIConfigProvider } from '@evergraytech/ai-config/react';

import { DemoCard } from '../components/DemoCard';

type StateScenariosScreenProps = {
  appDefinition: AIConfigAppDefinition;
};

function createScenarioManager(
  appDefinition: AIConfigAppDefinition,
  configure: (manager: ReturnType<typeof createAIConfigManager>) => void,
) {
  const manager = createAIConfigManager({ appDefinition });
  configure(manager);
  return manager;
}

export function StateScenariosScreen({ appDefinition }: StateScenariosScreenProps) {
  const defaultManager = createScenarioManager(appDefinition, () => {});

  const byokManager = createScenarioManager(appDefinition, (manager) => {
    manager.setMode('byok');
    manager.setProvider('openai');
    manager.setModel('gpt-4.1-mini');
  });

  const savedKeyManager = createScenarioManager(appDefinition, (manager) => {
    manager.setMode('byok');
    manager.setProvider('anthropic');
    manager.setModel('claude-3-5-sonnet');
    manager.setCredential('anthropic', {
      apiKey: 'sk-ant-demo-1234567890',
      validationState: 'valid',
      validationMessage: 'Validated in demo state',
      lastValidatedAt: new Date().toISOString(),
    });
  });

  return (
    <div className="demo-grid">
      <DemoCard title="Default mode">
        <AIConfigProvider
          appDefinition={appDefinition}
          manager={defaultManager}
          loadOnMount={false}
        >
          <AIConfigPanel />
        </AIConfigProvider>
      </DemoCard>
      <DemoCard title="BYOK selected">
        <AIConfigProvider appDefinition={appDefinition} manager={byokManager} loadOnMount={false}>
          <AIConfigPanel />
        </AIConfigProvider>
      </DemoCard>
      <DemoCard title="Saved key + validation state">
        <AIConfigProvider
          appDefinition={appDefinition}
          manager={savedKeyManager}
          loadOnMount={false}
        >
          <AIConfigPanel />
        </AIConfigProvider>
      </DemoCard>
    </div>
  );
}
