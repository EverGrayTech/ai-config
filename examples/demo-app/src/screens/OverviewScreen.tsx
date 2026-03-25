import React from 'react';

import { type AIConfigAppDefinition } from '@evergraytech/ai-config';
import { AIConfigPanel, AIConfigProvider } from '@evergraytech/ai-config/react';

import { DemoCard } from '../components/DemoCard';

type OverviewScreenProps = {
  appDefinition: AIConfigAppDefinition;
};

export function OverviewScreen({ appDefinition }: OverviewScreenProps) {
  return (
    <div className="demo-stack">
      <DemoCard title="Composed panel" description="Validate the default integrated settings experience and primary interactions.">
        <AIConfigProvider appDefinition={appDefinition} loadOnMount={false}>
          <AIConfigPanel />
        </AIConfigProvider>
      </DemoCard>
    </div>
  );
}
