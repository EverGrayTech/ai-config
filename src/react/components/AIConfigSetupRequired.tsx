'use client';

import React from 'react';

import type { AIConfigSetupMessageConfig, AIConfigSetupRequirementDetails } from '../../index';

export interface AIConfigSetupRequiredProps {
  requirement: AIConfigSetupRequirementDetails;
  config?: AIConfigSetupMessageConfig;
}

function getMissingItems(
  requirement: AIConfigSetupRequirementDetails,
  config?: AIConfigSetupMessageConfig,
): string[] {
  const items: string[] = [];

  if (requirement.missingClientId) {
    items.push(config?.clientIdLabel ?? 'client ID');
  }

  if (requirement.missingGatewayClient) {
    items.push(config?.gatewayLabel ?? 'gateway client');
  }

  return items;
}

export function AIConfigSetupRequired({ requirement, config }: AIConfigSetupRequiredProps) {
  const missingItems = getMissingItems(requirement, config);

  if (missingItems.length === 0) {
    return null;
  }

  return (
    <section
      className="eg-ai-config-setup-required"
      data-eg-ai-config-section="setup-required"
      aria-label="AI setup required"
    >
      <div className="eg-ai-config-setup-required-copy">
        <h2 className="eg-ai-config-setup-required-title">AI setup required</h2>
        <p className="eg-ai-config-setup-required-description">
          This app cannot use app-provided AI until its hosted AI configuration is completed.
        </p>
        <p className="eg-ai-config-setup-required-description">
          Missing configuration: {missingItems.join(' and ')}.
        </p>
        {config?.clientIdValue ? (
          <p className="eg-ai-config-setup-required-description">
            Expected {config.clientIdLabel ?? 'client ID'}: <code>{config.clientIdValue}</code>
          </p>
        ) : null}
      </div>
    </section>
  );
}
