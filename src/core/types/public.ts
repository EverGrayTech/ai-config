export const AI_CONFIG_SCHEMA_VERSION = 1;

export type AIConfigMode = 'default' | 'byok';

export type AIProviderId = 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'custom' | 'hosted';

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
  metadata?: {
    contextLength?: number;
    pricing?: Record<string, unknown>;
    raw?: unknown;
  };
}

export interface AIModelDiscoveryContext {
  apiKey?: string;
  forceRefresh?: boolean;
  signal?: AbortSignal;
}

export interface AIModelDiscoveryCacheEntry {
  models: AIModelDescriptor[];
  discoveredAt: number;
  expiresAt: number;
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

export interface AIConfigRouteSettings {
  provider: AIProviderId | null;
  model: string | null;
  generation: AIGenerationSettings;
}

export interface AIConfigCategoryRouteSettings extends AIConfigRouteSettings {
  enabled: boolean;
}

export interface AIOperationCategoryDefinition {
  key: string;
  label: string;
  description?: string;
}

export interface AIUsagePresentation {
  modeLabel?: string;
  usageHint?: string;
  costHint?: string;
  freeTierHint?: string;
}

export interface AIInvokeRequest {
  input: string;
  category?: string;
  stream?: boolean;
}

export interface AIInvokeSuccess {
  ok: true;
  provider: string;
  model: string;
  output: string;
  executionPath: 'hosted' | 'byok-gateway';
  providerLabel?: string;
  modelLabel?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface AIInvokeError {
  ok: false;
  category:
    | 'configuration'
    | 'authentication'
    | 'policy'
    | 'rate-limit'
    | 'network'
    | 'provider'
    | 'unknown';
  code:
    | 'missing-provider'
    | 'missing-model'
    | 'missing-credential'
    | 'invalid-category'
    | 'unsupported-provider'
    | 'unsupported-mode'
    | 'hosted-not-configured'
    | 'byok-not-configured'
    | 'hosted-auth-failed'
    | 'hosted-invoke-failed'
    | 'token-expired'
    | 'direct-invoke-failed';
  message: string;
  retryable?: boolean;
  details?: Record<string, string | number | boolean | null | undefined>;
  upstream?: {
    status?: number;
    code?: string;
    category?: string;
    message?: string;
    retryable?: boolean;
    details?: Record<string, string | number | boolean | null | undefined>;
  };
}

export type AIInvokeResult = AIInvokeSuccess | AIInvokeError;

export interface AIHostedAuthRequest {
  appId: string;
  clientId: string;
}

export interface AIHostedAuthResult {
  token: string;
  issuedAt?: string;
  expiresAt?: string;
}

export interface AIHostedInvokeRequest {
  token: string;
  provider?: string;
  model?: string;
  credential?: string;
  input: string;
  stream?: boolean;
}

export interface AIHostedInvokeSuccess {
  provider: string;
  model: string;
  output: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface AIHostedGatewayClient {
  authenticate(request: AIHostedAuthRequest): Promise<AIHostedAuthResult>;
  invoke(request: AIHostedInvokeRequest): Promise<AIHostedInvokeSuccess>;
}

export interface AIHostedGatewayError extends Error {
  status?: number;
  code?: string;
  category?: string;
  retryable?: boolean;
  details?: Record<string, string | number | boolean | null | undefined>;
}

export interface AIHostedGatewayOptions {
  clientId: string;
  gateway: AIHostedGatewayClient;
  shouldRefreshToken?: (error: unknown) => boolean;
}

export interface AIDirectInvokeRequest {
  provider: AIProviderId;
  model: string;
  credential: string;
  input: string;
  stream?: boolean;
}

export interface AIDirectProviderClient {
  invoke(request: AIDirectInvokeRequest): Promise<AIHostedInvokeSuccess>;
}

export interface AIDirectProviderRegistry {
  getClient(provider: AIProviderId): AIDirectProviderClient | undefined;
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
  operationCategories?: AIOperationCategoryDefinition[];
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
  routes?: {
    default: AIConfigRouteSettings;
    categories: Record<string, AIConfigCategoryRouteSettings>;
  };
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
  hostedGateway?: AIHostedGatewayOptions;
}

export interface AIConfigChangeEvent {
  nextState: AIConfigState;
}

export interface AIConfigManager {
  getState(): AIConfigState;
  setMode(mode: AIConfigMode): AIConfigState;
  setProvider(provider: AIProviderId | null): AIConfigState;
  setModel(modelId: string | null): AIConfigState;
  setRouteProvider(routeKey: 'default' | string, provider: AIProviderId | null): AIConfigState;
  setRouteModel(routeKey: 'default' | string, modelId: string | null): AIConfigState;
  updateRouteGeneration(
    routeKey: 'default' | string,
    settings: Partial<AIGenerationSettings>,
  ): AIConfigState;
  setCategoryEnabled(categoryKey: string, enabled: boolean): AIConfigState;
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
  invoke(request: AIInvokeRequest): Promise<AIInvokeResult>;
}
