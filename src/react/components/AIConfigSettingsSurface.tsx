'use client';

import React from 'react';

import type {
  AIConfigManagerOptions,
  AIConfigSetupMessageConfig,
  AIConfigSetupRequirementDetails,
} from '../../index';
import { AIConfigPanel } from './AIConfigPanel';
import { AIConfigSettingsHeader, type AIConfigSettingsHeaderProps } from './AIConfigSettingsHeader';
import { AIConfigSetupRequired } from './AIConfigSetupRequired';

export interface AIConfigSettingsSurfaceProps extends AIConfigSettingsHeaderProps {
  framed?: boolean;
  setupMessageConfig?: AIConfigSetupMessageConfig;
  managerOptions?: Pick<AIConfigManagerOptions, 'hostedGateway'>;
}

function getSetupRequirement(
  managerOptions?: Pick<AIConfigManagerOptions, 'hostedGateway'>,
  appId?: string,
): AIConfigSetupRequirementDetails | null {
  const hostedGateway = managerOptions?.hostedGateway;
  const missingClientId = !hostedGateway?.clientId;
  const missingGatewayClient = !hostedGateway?.gateway;

  if (!missingClientId && !missingGatewayClient) {
    return null;
  }

  return {
    appId: appId ?? 'app',
    missingClientId,
    missingGatewayClient,
  };
}

export function AIConfigSettingsSurface({
  title,
  description,
  framed = false,
  setupMessageConfig,
  managerOptions,
}: AIConfigSettingsSurfaceProps) {
  const requirement = getSetupRequirement(managerOptions, setupMessageConfig?.clientIdValue);

  return (
    <section
      className="eg-ai-config-settings-surface"
      data-eg-ai-config-surface="true"
      data-eg-ai-config-framed={framed ? 'true' : 'false'}
      aria-label="AI settings"
    >
      <AIConfigSettingsHeader title={title} description={description} />
      {requirement ? (
        <AIConfigSetupRequired requirement={requirement} config={setupMessageConfig} />
      ) : (
        <AIConfigPanel framed={false} />
      )}
    </section>
  );
}
