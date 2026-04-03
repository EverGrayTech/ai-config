'use client';

import React from 'react';

import { useAIConfigActions, useAIConfigAppDefinition, useAIConfigState } from '../context/AIConfigContext';
import { AIApiKeyField } from './AIApiKeyField';
import { AIConfigResetButton } from './AIConfigResetButton';
import { AIConfigStatus } from './AIConfigStatus';
import { AIGenerationSettingsForm } from './AIGenerationSettingsForm';
import { AIModeSelector } from './AIModeSelector';
import { AIModelSelector } from './AIModelSelector';
import type { AIProviderId } from '../../index';

export interface AIConfigPanelProps {
  framed?: boolean;
}

function toSentenceCaseLabel(label: string): string {
  return label.trim();
}

function formatSectionHeading(label: string, description?: string): React.ReactNode {
  if (!description) {
    return <span className="eg-ai-config-route-summary-title">{label}</span>;
  }

  return (
    <>
      <span className="eg-ai-config-route-summary-title">{label}</span>
      <span className="eg-ai-config-route-summary-separator">—</span>
      <span className="eg-ai-config-route-summary-description">{description}</span>
    </>
  );
}

function getDefaultRouteDescription(hasCategories: boolean): string {
  if (!hasCategories) {
    return 'Used for all queries in this configuration.';
  }

  return 'Used as the fallback for queries without an enabled category override.';
}

function resolveRouteProvider(
  state: ReturnType<typeof useAIConfigState>,
  routeKey: 'default' | string,
): AIProviderId | null {
  if (routeKey === 'default') {
    return state.mode === 'default' ? null : state.selectedProvider;
  }

  const route = state.routes?.categories?.[routeKey];
  if (!route?.enabled || route.provider == null || route.provider === 'hosted') {
    return null;
  }

  return route.provider;
}

function resolveRouteModel(
  state: ReturnType<typeof useAIConfigState>,
  routeKey: 'default' | string,
): string | null {
  if (routeKey === 'default') {
    return state.mode === 'default' ? null : state.selectedModel;
  }

  const route = state.routes?.categories?.[routeKey];
  if (!route?.enabled || route.provider == null || route.provider === 'hosted') {
    return null;
  }

  return route.model;
}

function AIAssignedParameters({ routeKey = 'default', label }: { routeKey?: 'default' | string; label?: string }) {
  const state = useAIConfigState();
  const provider = resolveRouteProvider(state, routeKey);
  const model = resolveRouteModel(state, routeKey);
  const showByokFields = provider != null;

  return (
    <>
      <AIModeSelector routeKey={routeKey} />
      <AIApiKeyField provider={provider} visible={showByokFields} />
      {showByokFields ? (
        <AIModelSelector routeKey={routeKey} label={label ?? 'Model'} ariaLabel={label ?? 'AI model'} />
      ) : null}
      <AIConfigStatus provider={provider} model={model} visible={showByokFields} />
      <AIGenerationSettingsForm collapsible defaultOpen={false} />
    </>
  );
}

function AIDefaultRouteSection({ hasCategories }: { hasCategories: boolean }) {
  return (
    <details
      className="eg-ai-config-section eg-ai-config-route-section eg-ai-config-route-card-default"
      data-eg-ai-config-section="route-default"
      open
    >
      <summary className="eg-ai-config-route-summary">
        <span className="eg-ai-config-route-summary-copy">
          {formatSectionHeading('Default', getDefaultRouteDescription(hasCategories))}
        </span>
      </summary>
      <AIAssignedParameters routeKey="default" label="Model" />
    </details>
  );
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
      <summary className="eg-ai-config-route-summary">
        <span className="eg-ai-config-route-summary-copy">
          {formatSectionHeading(label, description ?? 'Uses a category-specific override when enabled.')}
        </span>
        <label
          className="eg-ai-config-choice eg-ai-config-route-toggle"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={route.enabled}
            onChange={(event) => actions.setCategoryEnabled(categoryKey, event.target.checked)}
          />
          Override
        </label>
      </summary>
      {route.enabled ? <AIAssignedParameters routeKey={categoryKey} label="Model" /> : <p className="eg-ai-config-route-inheritance">Uses Default settings until enabled.</p>}
    </details>
  );
}

export function AIConfigPanel({ framed = false }: AIConfigPanelProps) {
  const appDefinition = useAIConfigAppDefinition();
  const state = useAIConfigState();
  const categories = appDefinition.operationCategories ?? [];
  const hasCategories = categories.length > 0;

  return (
    <section
      aria-label="AI configuration panel"
      className="eg-ai-config-panel"
      data-eg-ai-config-panel="true"
      data-eg-ai-config-framed={framed ? 'true' : 'false'}
    >
      {hasCategories ? (
        <>
          <AIDefaultRouteSection hasCategories={hasCategories} />
          {categories.map((category) => (
            <AIRouteSection
              key={category.key}
              categoryKey={category.key}
              label={toSentenceCaseLabel(category.label)}
              description={category.description}
            />
          ))}
        </>
      ) : state.mode === 'byok' ? (
        <>
          <AIAssignedParameters routeKey="default" label="Model" />
        </>
      ) : (
        <>
          <AIModeSelector />
          <AIGenerationSettingsForm collapsible defaultOpen={false} />
        </>
      )}
      <AIConfigResetButton />
    </section>
  );
}
