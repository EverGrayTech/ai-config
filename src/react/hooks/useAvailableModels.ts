'use client';

import { type AIModelDescriptor, getAvailableModels } from '../../index';
import { useAIConfig, useAIConfigAppDefinition } from '../context/AIConfigContext';

export function useAvailableModels(routeKey: 'default' | string = 'default'): AIModelDescriptor[] {
  const appDefinition = useAIConfigAppDefinition();
  const { state } = useAIConfig();
  const provider =
    routeKey === 'default'
      ? state.selectedProvider
      : (state.routes?.categories?.[routeKey]?.provider ?? null);

  if (!provider) {
    return [];
  }

  return getAvailableModels(provider, appDefinition);
}
