'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  type AIConfigAppDefinition,
  type AIConfigChangeEvent,
  type AIConfigManager,
  type AIConfigManagerOptions,
  type AIConfigState,
  type AICredentialRecord,
  type AIGenerationSettings,
  type AIProviderId,
  createAIConfigManager,
} from '../../index';

interface AIConfigContextValue {
  manager: AIConfigManager;
  state: AIConfigState;
}

const AIConfigContext = createContext<AIConfigContextValue | null>(null);

export interface AIConfigProviderProps {
  appDefinition: AIConfigAppDefinition;
  children: React.ReactNode;
  manager?: AIConfigManager;
  managerOptions?: Omit<AIConfigManagerOptions, 'appDefinition'>;
  loadOnMount?: boolean;
  onChange?: (event: AIConfigChangeEvent) => void;
}

export function AIConfigProvider({
  appDefinition,
  children,
  manager,
  managerOptions,
  loadOnMount = true,
  onChange,
}: AIConfigProviderProps) {
  const resolvedManager = useMemo(
    () => manager ?? createAIConfigManager({ appDefinition, ...managerOptions }),
    [appDefinition, manager, managerOptions],
  );
  const [state, setState] = useState<AIConfigState>(resolvedManager.getState());

  useEffect(() => {
    const unsubscribe = resolvedManager.subscribe((nextState) => {
      setState(nextState);
    });

    setState(resolvedManager.getState());

    return unsubscribe;
  }, [resolvedManager]);

  useEffect(() => {
    if (!loadOnMount) {
      return;
    }

    void resolvedManager.load();
  }, [loadOnMount, resolvedManager]);

  useEffect(() => {
    if (!onChange) {
      return;
    }

    return resolvedManager.onChange(onChange);
  }, [onChange, resolvedManager]);
  return (
    <AIConfigContext.Provider value={{ manager: resolvedManager, state }}>
      {children}
    </AIConfigContext.Provider>
  );
}

export function useAIConfigAppDefinition(): AIConfigAppDefinition {
  const { manager } = useAIConfig();

  return manager.getAppDefinition();
}

export function useAIConfig(): AIConfigContextValue {
  const value = useContext(AIConfigContext);

  if (!value) {
    throw new Error('useAIConfig must be used within an AIConfigProvider.');
  }

  return value;
}

export function useAIConfigState(): AIConfigState {
  return useAIConfig().state;
}

export interface AIConfigActions {
  setMode: (mode: AIConfigState['mode']) => AIConfigState;
  setProvider: (provider: AIProviderId | null) => AIConfigState;
  setModel: (modelId: string | null) => AIConfigState;
  setRouteProvider: (routeKey: 'default' | string, provider: AIProviderId | null) => AIConfigState;
  setRouteModel: (routeKey: 'default' | string, modelId: string | null) => AIConfigState;
  updateRouteGeneration: (
    routeKey: 'default' | string,
    settings: Partial<AIGenerationSettings>,
  ) => AIConfigState;
  setCategoryEnabled: (categoryKey: string, enabled: boolean) => AIConfigState;
  setCredential: (
    provider: AIProviderId,
    credential: Pick<AICredentialRecord, 'apiKey' | 'label'>,
  ) => AIConfigState;
  clearCredential: (provider: AIProviderId) => AIConfigState;
  updateGeneration: (settings: Partial<AIGenerationSettings>) => AIConfigState;
  reset: () => AIConfigState;
  load: () => Promise<AIConfigState>;
  save: () => Promise<void>;
  clearPersisted: () => Promise<void>;
}

export function useAIConfigActions(): AIConfigActions {
  const { manager } = useAIConfig();

  return {
    setMode: (mode) => manager.setMode(mode),
    setProvider: (provider) => manager.setProvider(provider),
    setModel: (modelId) => manager.setModel(modelId),
    setRouteProvider: (routeKey, provider) => manager.setRouteProvider(routeKey, provider),
    setRouteModel: (routeKey, modelId) => manager.setRouteModel(routeKey, modelId),
    updateRouteGeneration: (routeKey, settings) =>
      manager.updateRouteGeneration(routeKey, settings),
    setCategoryEnabled: (categoryKey, enabled) => manager.setCategoryEnabled(categoryKey, enabled),
    setCredential: (provider, credential) => manager.setCredential(provider, credential),
    clearCredential: (provider) => manager.clearCredential(provider),
    updateGeneration: (settings) => manager.updateGeneration(settings),
    reset: () => manager.reset(),
    load: () => manager.load(),
    save: () => manager.save(),
    clearPersisted: () => manager.clearPersisted(),
  };
}
