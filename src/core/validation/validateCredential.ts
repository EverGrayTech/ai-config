import { getProviderById } from '../providers/registry';
import type {
  AIConfigAppDefinition,
  AIProviderDefinition,
  AIProviderId,
  AIProviderRegistryOptions,
  AIValidationResult,
} from '../types/public';

function getDefaultValidationMessage(provider: AIProviderDefinition): string {
  return `${provider.label} credential validation is not configured.`;
}

export async function validateCredential(
  providerId: AIProviderId,
  apiKey: string,
  appDefinition?: AIConfigAppDefinition,
  options?: AIProviderRegistryOptions,
): Promise<AIValidationResult> {
  const provider = getProviderById(providerId, appDefinition, options);

  if (!provider) {
    return {
      ok: false,
      status: 'error',
      message: `Unknown provider: ${providerId}`,
      validatedAt: new Date().toISOString(),
    };
  }

  if (!provider.validateCredential) {
    return {
      ok: false,
      status: 'error',
      message: getDefaultValidationMessage(provider),
      validatedAt: new Date().toISOString(),
    };
  }

  return provider.validateCredential({
    apiKey,
    provider: providerId,
  });
}
