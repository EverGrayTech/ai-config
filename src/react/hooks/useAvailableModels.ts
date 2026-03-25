'use client';

import { type AIModelDescriptor, getAvailableModels } from '../../index';
import { useAIConfig, useAIConfigAppDefinition } from '../context/AIConfigContext';

export function useAvailableModels(): AIModelDescriptor[] {
  const appDefinition = useAIConfigAppDefinition();
  const { state } = useAIConfig();

  if (!state.selectedProvider) {
    return [];
  }

  return getAvailableModels(state.selectedProvider, appDefinition);
}
