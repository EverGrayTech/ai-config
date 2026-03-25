'use client';

import { getAvailableModels, type AIModelDescriptor } from '../../index';
import { useAIConfigAppDefinition, useAIConfig } from '../context/AIConfigContext';

export function useAvailableModels(): AIModelDescriptor[] {
  const appDefinition = useAIConfigAppDefinition();
  const { state } = useAIConfig();

  if (!state.selectedProvider) {
    return [];
  }

  return getAvailableModels(state.selectedProvider, appDefinition);
}
