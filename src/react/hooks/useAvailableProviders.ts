'use client';

import { getAvailableProviders, type AIProviderDefinition } from '../../index';
import { useAIConfigAppDefinition } from '../context/AIConfigContext';

export function useAvailableProviders(): AIProviderDefinition[] {
  const appDefinition = useAIConfigAppDefinition();

  return getAvailableProviders(appDefinition);
}
