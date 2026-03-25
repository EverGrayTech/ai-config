# Consumption Guide

This document is the canonical entrypoint for downstream developers integrating `@evergraytech/ai-config`.

## What this package is for

`@evergraytech/ai-config` provides a reusable, local-first AI configuration layer for TypeScript and React applications.

It helps host apps:

- offer a zero-setup app-provided AI mode
- support bring-your-own-key provider workflows
- persist AI settings locally in the browser
- present provider/model/settings management consistently across products

It is not the full AI execution runtime.

## What to install

```bash
pnpm add @evergraytech/ai-config react
```

## What to import

- headless/core APIs from `@evergraytech/ai-config`
- React APIs from `@evergraytech/ai-config/react`
- stylesheet from `@evergraytech/ai-config/styles/base.css`

## Integration boundaries

Use this package for configuration, settings state, provider/model selection, validation surfaces, and related UI.

Do not treat it as:

- a complete inference runtime
- a prompt orchestration framework
- a billing or exact usage-metering system
- a backend credential vault

## Headless usage

```ts
import {
  createAIConfigManager,
  getAvailableModels,
  validateCredential,
  type AIConfigAppDefinition,
} from '@evergraytech/ai-config';

const appDefinition: AIConfigAppDefinition = {
  appId: 'plot-your-path',
  defaultMode: {
    enabled: true,
    label: 'EverGray Tech default AI',
    provider: 'hosted',
    model: 'evergray-tech-default',
    usageHint: 'Free usage is limited by the host app.',
  },
  byok: {
    enabled: true,
    providers: ['openai', 'anthropic'],
  },
};

const manager = createAIConfigManager({ appDefinition });
manager.setMode('byok');
manager.setProvider('openai');
manager.setModel(getAvailableModels('openai', appDefinition)[0]?.id ?? null);

const result = await validateCredential('openai', 'sk-example', appDefinition);
console.log(result.status, manager.getState());
```

## React usage

```tsx
'use client';

import '@evergraytech/ai-config/styles/base.css';
import { AIConfigPanel, AIConfigProvider } from '@evergraytech/ai-config/react';
import type { AIConfigAppDefinition } from '@evergraytech/ai-config';

const appDefinition: AIConfigAppDefinition = {
  appId: 'design-system-demo',
  defaultMode: {
    enabled: true,
    label: 'App-provided AI',
    provider: 'hosted',
    model: 'evergray-default',
  },
  byok: {
    enabled: true,
    providers: ['openai', 'anthropic'],
  },
};

export function AISettingsCard() {
  return (
    <AIConfigProvider appDefinition={appDefinition}>
      <AIConfigPanel />
    </AIConfigProvider>
  );
}
```

## Styling usage

Import the package stylesheet:

```ts
import '@evergraytech/ai-config/styles/base.css';
```

The package provides stable styling hooks including:

- `.eg-ai-config-panel`
- `.eg-ai-config-section`
- `.eg-ai-config-field`
- `.eg-ai-config-control`
- `.eg-ai-config-button`
- `.eg-ai-config-status`

Host apps can override the package styling either by targeting those hooks directly or by overriding the exposed AI-scoped CSS variables.

## Optional design-system-aware styling

If your app already imports EverGray Tech design-system CSS variables, ai-config will automatically bridge to them through its AI-scoped CSS variables.

Example host import:

```css
@import '@evergraytech/design-system/dist/variables.css';
```

Then import ai-config’s stylesheet as normal.

This package does **not** import or depend on `@evergraytech/design-system`; the bridge is CSS-variable-based only.

## Host-app customization

Host apps can control:

- default mode availability and messaging
- BYOK enablement and provider list
- model filtering and curation
- provider ordering and overrides
- validation behavior
- storage adapter replacement

Host apps may also choose to consume only the headless layer and build their own UI entirely.

## Persistence and validation posture

- settings persist locally by default using `localStorage`
- persistence is versioned and normalized for recovery
- validation is pluggable and may be host-defined or provider-defined
- raw secrets should not be logged or exposed in validation results

## Local-first credential caveat

Provider keys stored through this package live on the user’s device/browser context. That is not equivalent to secure server-side secret storage.

Host apps should communicate that posture clearly.

## When to use headless vs React

Use the **headless layer** when:

- you want full control over layout and rendering
- your app already has a bespoke settings UI

Use the **React layer** when:

- you want a faster integration path
- you want shared EverGray-consistent settings behavior with light styling

## Related docs

- [README.md](README.md) — repo/package overview
- [System Spec](docs/system-spec.md) — architectural expectations and boundaries
- [Development](docs/development.md) — maintainer workflows for this repo
