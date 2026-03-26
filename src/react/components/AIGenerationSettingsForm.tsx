'use client';

import React from 'react';

import { useAIConfigActions, useAIConfigState } from '../context/AIConfigContext';

export interface AIGenerationSettingsFormProps {
  routeKey?: 'default' | string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  title?: string;
}

function summarizeGeneration(settings: {
  temperature?: number;
  maxOutputTokens?: number;
  reasoningPreset?: 'low' | 'medium' | 'high';
}): string | null {
  const parts = [
    settings.temperature != null ? `Temp ${settings.temperature}` : null,
    settings.maxOutputTokens != null ? `Max ${settings.maxOutputTokens}` : null,
    settings.reasoningPreset ? `Reasoning ${settings.reasoningPreset}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' • ') : null;
}

export function AIGenerationSettingsForm({
  routeKey = 'default',
  collapsible = false,
  defaultOpen = true,
  title = 'Generation settings',
}: AIGenerationSettingsFormProps) {
  const state = useAIConfigState();
  const actions = useAIConfigActions();
  const generation =
    routeKey === 'default'
      ? state.generation
      : (state.routes?.categories?.[routeKey]?.generation ?? state.generation);
  const summary = summarizeGeneration(generation);
  const content = (
    <>
      <label className="eg-ai-config-field">
        Temperature
        <input
          className="eg-ai-config-control"
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={generation.temperature ?? ''}
          onChange={(event) =>
            routeKey === 'default'
              ? actions.updateGeneration({ temperature: Number(event.target.value) })
              : actions.updateRouteGeneration(routeKey, {
                  temperature: Number(event.target.value),
                })
          }
        />
      </label>
      <label className="eg-ai-config-field">
        Max output tokens
        <input
          className="eg-ai-config-control"
          type="number"
          min="1"
          step="1"
          value={generation.maxOutputTokens ?? ''}
          onChange={(event) =>
            routeKey === 'default'
              ? actions.updateGeneration({ maxOutputTokens: Number(event.target.value) })
              : actions.updateRouteGeneration(routeKey, {
                  maxOutputTokens: Number(event.target.value),
                })
          }
        />
      </label>
      <label className="eg-ai-config-field">
        Reasoning preset
        <select
          className="eg-ai-config-control"
          aria-label="Reasoning preset"
          value={generation.reasoningPreset ?? ''}
          onChange={(event) =>
            (routeKey === 'default'
              ? actions.updateGeneration
              : (settings: { reasoningPreset?: 'low' | 'medium' | 'high' }) =>
                  actions.updateRouteGeneration(routeKey, settings))({
              reasoningPreset: event.target.value
                ? (event.target.value as 'low' | 'medium' | 'high')
                : undefined,
            })
          }
        >
          <option value="">Default</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
    </>
  );

  if (collapsible) {
    return (
      <details
        className="eg-ai-config-section eg-ai-config-generation-settings"
        data-eg-ai-config-section="generation"
        open={defaultOpen}
      >
        <summary>
          {title}
          {summary ? <span className="eg-ai-config-generation-summary"> — {summary}</span> : null}
        </summary>
        <div>{content}</div>
      </details>
    );
  }

  return (
    <fieldset
      className="eg-ai-config-section eg-ai-config-generation-settings"
      data-eg-ai-config-section="generation"
    >
      <legend>{title}</legend>
      {content}
    </fieldset>
  );
}
