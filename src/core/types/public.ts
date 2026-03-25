export const AI_CONFIG_SCHEMA_VERSION = 1;

export type AIConfigMode = 'default' | 'byok';

export type AIProviderId = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'custom' | 'hosted';

export interface AIModelCapabilities {
  text?: boolean;
  reasoning?: boolean;
  vision?: boolean;
  structuredOutput?: boolean;
  streaming?: boolean;
}

export interface AIModelDescriptor {
  id: string;
  label: string;
  provider: AIProviderId;
  capabilities?: AIModelCapabilities;
  contextWindow?: number;
  outputLimit?: number;
  costHint?: 'low' | 'medium' | 'high';
  status?: 'active' | 'preview' | 'deprecated';
  disabled?: boolean;
}

export type AIValidationState = 'unknown' | 'valid' | 'invalid' | 'error';

export interface AICredentialRecord {
  provider: AIProviderId;
  apiKey?: string;
  label?: string;
  isPresent: boolean;
  lastValidatedAt?: string;
  validationState?: AIValidationState;
  validationMessage?: string;
}

export interface AIGenerationSettings {
  temperature?: number;
  maxOutputTokens?: number;
  reasoningPreset?: 'low' | 'medium' | 'high';
}

export interface AIUsagePresentation {
  modeLabel?: string;
  usageHint?: string;
  costHint?: string;
  freeTierHint?: string;
}

export interface AIValidationResult {
  ok: boolean;
  status: 'valid' | 'invalid' | 'error';
  message?: string;
  validatedAt?: string;
}

export interface AIProviderValidationInput {
  apiKey: string;
  provider: AIProviderId;
}

export type AIProviderValidationResolver = (
  input: AIProviderValidationInput,
) => Promise<AIValidationResult>;

export interface AIProviderDefinition {
  id: AIProviderId;
  label: string;
  credentialLabel: string;
  credentialPlaceholder?: string;
  supportsBYOK: boolean;
  models: AIModelDescriptor[];
  validateCredential?: AIProviderValidationResolver;
  helpText?: string;
  docsUrl?: string;
}

export interface AIProviderRegistryOptions {
  providers?: AIProviderDefinition[];
  overrides?: Partial<Record<AIProviderId, Partial<AIProviderDefinition>>>;
}

export interface AIDefaultModeDefinition {
  enabled: boolean;
  label: string;
  description?: string;
  model?: string;
  provider?: AIProviderId;
  usageHint?: string;
}

export interface AIBYOKDefinition {
  enabled: boolean;
  providers: AIProviderId[];
}

export interface AIConfigAppDefinition {
  appId: string;
  storageKey?: string;
  defaultMode?: AIDefaultModeDefinition;
  byok?: AIBYOKDefinition;
  modelFilter?: (model: AIModelDescriptor) => boolean;
  providerOrder?: AIProviderId[];
  providerOverrides?: Partial<Record<AIProviderId, Partial<AIProviderDefinition>>>;
  defaultGeneration?: AIGenerationSettings;
  usagePresentation?: AIUsagePresentation;
}

export interface AIConfigState {
  mode: AIConfigMode;
  selectedProvider: AIProviderId | null;
  selectedModel: string | null;
  credentials: Record<string, AICredentialRecord>;
  generation: AIGenerationSettings;
  usagePresentation?: AIUsagePresentation;
}

export interface AIPersistedConfigPayload {
  schemaVersion: number;
  state: AIConfigState;
}

export interface AIConfigStorageAdapter {
  load(): Promise<AIPersistedConfigPayload | null> | AIPersistedConfigPayload | null;
  save(payload: AIPersistedConfigPayload): Promise<void> | void;
  clear(): Promise<void> | void;
}

export interface AIConfigManagerOptions {
  appDefinition: AIConfigAppDefinition;
  storage?: AIConfigStorageAdapter;
  initialState?: Partial<AIConfigState>;
}

export interface AIConfigChangeEvent {
  nextState: AIConfigState;
}

export interface AIConfigManager {
  getState(): AIConfigState;
  setMode(mode: AIConfigMode): AIConfigState;
  setProvider(provider: AIProviderId | null): AIConfigState;
  setModel(modelId: string | null): AIConfigState;
  setCredential(
    provider: AIProviderId,
    credential: Pick<AICredentialRecord, 'apiKey' | 'label'>,
  ): AIConfigState;
  clearCredential(provider: AIProviderId): AIConfigState;
  updateGeneration(settings: Partial<AIGenerationSettings>): AIConfigState;
  reset(): AIConfigState;
  subscribe(listener: (state: AIConfigState) => void): () => void;
  onChange(listener: (event: AIConfigChangeEvent) => void): () => void;
  load(): Promise<AIConfigState>;
  save(): Promise<void>;
  clearPersisted(): Promise<void>;
  getAppDefinition(): AIConfigAppDefinition;
}
