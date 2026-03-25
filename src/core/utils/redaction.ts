import type { AIConfigState } from '../types/public';

export function redactCredential(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.length <= 8) {
    return '••••';
  }

  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function sanitizeAIConfigForDebug(state: AIConfigState): AIConfigState {
  const credentials = Object.fromEntries(
    Object.entries(state.credentials).map(([provider, credential]) => [
      provider,
      {
        ...credential,
        apiKey: redactCredential(credential.apiKey),
      },
    ]),
  );

  return {
    ...state,
    credentials,
  };
}

export function isProviderConfigured(state: AIConfigState, provider: string): boolean {
  return Boolean(state.credentials[provider]?.isPresent);
}
