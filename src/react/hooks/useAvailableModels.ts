'use client';

import { useEffect } from 'react';

import { type AIModelDescriptor, discoverAvailableModels, getAvailableModels } from '../../index';
import { useAIConfig, useAIConfigAppDefinition } from '../context/AIConfigContext';

export function useAvailableModels(routeKey: 'default' | string = 'default'): AIModelDescriptor[] {
  const appDefinition = useAIConfigAppDefinition();
  const { state } = useAIConfig();
  const provider =
    routeKey === 'default'
      ? state.selectedProvider
      : (state.routes?.categories?.[routeKey]?.provider ?? null);
  const openAIApiKey = state.credentials.openai?.apiKey;

  useEffect(() => {
    if (!provider) {
      return;
    }

    if (provider === 'openrouter') {
      void discoverAvailableModels(provider, undefined, appDefinition);
      return;
    }

    if (provider === 'openai' && openAIApiKey) {
      void discoverAvailableModels(provider, { apiKey: openAIApiKey }, appDefinition);
    }
  }, [appDefinition, openAIApiKey, provider]);

  if (!provider) {
    return [];
  }

  return getAvailableModels(provider, appDefinition);
}
