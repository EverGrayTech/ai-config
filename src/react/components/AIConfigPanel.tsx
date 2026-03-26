'use client';

import React from 'react';

import {
  useAIConfigActions,
  useAIConfigAppDefinition,
  useAIConfigState,
} from '../context/AIConfigContext';
import { AIApiKeyField } from './AIApiKeyField';
import { AIConfigResetButton } from './AIConfigResetButton';
import { AICredentialStatus } from './AICredentialStatus';
import { AIGenerationSettingsForm } from './AIGenerationSettingsForm';
import { AIModeSelector } from './AIModeSelector';
import { AIModelSelector } from './AIModelSelector';
import { AIProviderSelector } from './AIProviderSelector';
import { AIUsageHint } from './AIUsageHint';

export interface AIConfigPanelProps {
  framed?: boolean;
}

function AIRouteSection({
  categoryKey,
  label,
  description,
}: { categoryKey: string; label: string; description?: string }) {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const route = state.routes?.categories?.[categoryKey];

  if (!route) {
    return null;
  }

  return (
    <details
      className="eg-ai-config-section eg-ai-config-route-section"
      data-eg-ai-config-section="route-category"
    >
      <summary>{label}</summary>
      {description ? <p>{description}</p> : null}
      <label className="eg-ai-config-choice">
        <input
          type="checkbox"
          checked={route.enabled}
          onChange={(event) => actions.setCategoryEnabled(categoryKey, event.target.checked)}
        />
        Enable category override
      </label>
      {route.enabled ? (
        <>
          <AIProviderSelector
            routeKey={categoryKey}
            label={`${label} provider`}
            ariaLabel={`${label} provider`}
          />
          <AIModelSelector
            routeKey={categoryKey}
            label={`${label} model`}
            ariaLabel={`${label} model`}
          />
          <AIGenerationSettingsForm
            routeKey={categoryKey}
            collapsible
            defaultOpen={false}
            title={`${label} generation settings`}
          />
        </>
      ) : (
        <p>Uses Default route settings.</p>
      )}
    </details>
  );
}

export function AIConfigPanel({ framed = false }: AIConfigPanelProps) {
  const appDefinition = useAIConfigAppDefinition();
  const categories = appDefinition.operationCategories ?? [];

  return (
    <section
      aria-label="AI configuration panel"
      className="eg-ai-config-panel"
      data-eg-ai-config-panel="true"
      data-eg-ai-config-framed={framed ? 'true' : 'false'}
    >
      <AIModeSelector />
      <AIProviderSelector label="Default provider" ariaLabel="AI provider" />
      <AIModelSelector label="Default model" ariaLabel="AI model" />
      <AIApiKeyField />
      <AICredentialStatus />
      <AIGenerationSettingsForm
        collapsible={categories.length > 0}
        defaultOpen={categories.length === 0}
      />
      {categories.map((category) => (
        <AIRouteSection
          key={category.key}
          categoryKey={category.key}
          label={category.label}
          description={category.description}
        />
      ))}
      <AIUsageHint />
      <AIConfigResetButton />
    </section>
  );
}
