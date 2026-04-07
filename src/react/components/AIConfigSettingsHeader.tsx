'use client';

import React from 'react';

export interface AIConfigSettingsHeaderProps {
  title?: string;
  description?: string;
}

export function AIConfigSettingsHeader({
  title = 'AI settings',
  description = 'Choose whether to use app-provided AI or configure your own provider and model.',
}: AIConfigSettingsHeaderProps) {
  return (
    <header className="eg-ai-config-settings-header" data-eg-ai-config-section="settings-header">
      <h2 className="eg-ai-config-settings-title">{title}</h2>
      <p className="eg-ai-config-settings-description">{description}</p>
    </header>
  );
}
