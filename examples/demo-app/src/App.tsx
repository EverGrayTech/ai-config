import React, { useMemo, useState } from 'react';

import type { AIConfigAppDefinition } from '@evergraytech/ai-config';

import { DemoNav } from './components/DemoNav';
import { DemoShell } from './components/DemoShell';
import { ComponentGalleryScreen } from './screens/ComponentGalleryScreen';
import { RouteValidationScreen } from './screens/RouteValidationScreen';
import { StateScenariosScreen } from './screens/StateScenariosScreen';

type DemoScreenId = 'overview' | 'gallery' | 'states';

const appDefinition: AIConfigAppDefinition = {
  appId: 'ai-config-demo-app',
  defaultMode: {
    enabled: true,
    label: 'Free Trial',
    provider: 'hosted',
    model: 'hosted-model',
    usageHint: 'Demo free mode with app-provided access.',
  },
  byok: {
    enabled: true,
    providers: ['anthropic', 'google', 'openai', 'openrouter'],
  },
  defaultGeneration: {
    temperature: 0.4,
    maxOutputTokens: 600,
  },
};

export default function App() {
  const [screen, setScreen] = useState<DemoScreenId>('overview');
  const [designSystemMode, setDesignSystemMode] = useState(false);

  const screens = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview' },
      { id: 'gallery' as const, label: 'Component gallery' },
      { id: 'states' as const, label: 'State scenarios' },
    ],
    [],
  );

  return (
    <div className={`demo-app${designSystemMode ? ' demo-design-system' : ''}`}>
      <aside className="demo-sidebar">
        <h1>AI Config Demo</h1>
        <p className="demo-note">
          Local validation harness for composed flows, individual components, and scenario states.
        </p>
        <DemoNav screens={screens} activeScreen={screen} onSelect={setScreen} />
      </aside>
      <DemoShell
        title={screens.find((item) => item.id === screen)?.label ?? 'Overview'}
        designSystemMode={designSystemMode}
        onToggleDesignSystemMode={() => setDesignSystemMode((value) => !value)}
      >
        {screen === 'overview' ? <RouteValidationScreen /> : null}
        {screen === 'gallery' ? <ComponentGalleryScreen appDefinition={appDefinition} /> : null}
        {screen === 'states' ? <StateScenariosScreen appDefinition={appDefinition} /> : null}
      </DemoShell>
    </div>
  );
}
