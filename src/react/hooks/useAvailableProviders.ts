'use client';

import { type AIProviderDefinition, getAvailableProviders } from '../../index';
import { useAIConfigAppDefinition } from '../context/AIConfigContext';

export function useAvailableProviders(): AIProviderDefinition[] {
  const appDefinition = useAIConfigAppDefinition();

  return getAvailableProviders(appDefinition);
}
