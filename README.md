# EverGray Tech: AI Config

`@evergraytech/ai-config` is a shared TypeScript package for EverGray Tech apps that need configurable AI behavior without requiring accounts, backend persistence, or provider setup before first use.

It is designed for a client-first, local-first model:

- apps can offer a built-in default AI mode so users can start immediately
- power users can optionally bring their own provider API keys
- provider, model, and generation preferences can be managed consistently across apps
- settings are stored locally in the browser rather than in an EverGray-managed backend

## Why this package exists

EverGray Tech apps need a reusable way to present AI configuration that feels consistent across products while remaining flexible enough for different app-level policies.

This package is intended to solve that shared problem by providing:

- a typed configuration and state model
- local persistence and recovery behavior
- provider and model registry abstractions
- validation hooks and credential-management helpers
- optional React components for settings UIs

It is not intended to be the full AI execution runtime. It manages configuration, user preferences, provider metadata, and related UX concerns so host apps can integrate AI features with less duplication.

## Core capabilities

- zero-setup default mode for app-provided AI access
- bring-your-own-key workflows for supported providers
- provider and model selection
- generation settings such as temperature and output limits
- local credential storage and management
- rough usage and cost-awareness messaging
- headless and React-friendly integration paths

## Installation

```bash
pnpm add @evergraytech/ai-config react
```

Use the headless API from `@evergraytech/ai-config` and the optional React layer from `@evergraytech/ai-config/react`.

## Headless usage example

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
  defaultGeneration: {
    temperature: 0.4,
    maxOutputTokens: 800,
  },
};

const manager = createAIConfigManager({ appDefinition });

manager.setMode('byok');
manager.setProvider('openai');
manager.setModel(getAvailableModels('openai', appDefinition)[0]?.id ?? null);
manager.setCredential('openai', { apiKey: 'sk-example' });

const result = await validateCredential('openai', 'sk-example', appDefinition);
await manager.save();

console.log(result.status, manager.getState());
```

## React usage example

```tsx
'use client';

import {
  AIConfigPanel,
  AIConfigProvider,
} from '@evergraytech/ai-config/react';
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

## Host app customization example

- filter providers with `byok.providers`
- reorder them with `providerOrder`
- restrict models with `modelFilter`
- override labels/help text/validation with `providerOverrides`
- replace browser storage with a custom `AIConfigStorageAdapter`

## Persistence, recovery, and versioning

- stored state uses a schema-versioned payload
- default persistence uses `localStorage` through an adapter
- SSR/non-browser usage fails safely
- corrupted or incompatible payloads reset to a valid normalized state
- normalization preserves unaffected settings when providers/models disappear

## Validation and security notes

- validation is pluggable and can be supplied by providers or host apps
- raw secrets should never be logged or surfaced in validation output
- stored keys are local to the user’s browser/device and are **not** equivalent to server-side secret storage
- use `redactCredential()` and `sanitizeAIConfigForDebug()` for safe debug surfaces

## Styling and theming guidance

- built-in React components are intentionally lightly styled
- wrap components in your design-system primitives where needed
- prefer using the headless layer if a host app needs fully custom layout or behavior
- current components are designed to remain usable in dark-theme and restrained UI contexts

## Local-first credential caveat

This package intentionally supports storing provider API keys locally in the user’s browser/device context.

That is a usability tradeoff, not a server-grade security model.

- credentials stored through this package are not equivalent to secure server-side secret storage
- the package should avoid logging raw secrets and should provide redaction helpers
- consuming apps should clearly communicate that locally stored keys remain under the user’s device/browser security posture

## Intended package shape

The package is expected to be delivered as one publishable package with two logical layers:

- headless/core exports for state, storage, registries, validation, and utilities
- optional React exports for hooks, context, and settings components

## Intended usage modes

### Default app-provided mode

Host apps can expose a built-in AI option so users can start immediately without entering an API key.

### Bring your own key

Users can optionally select a supported provider, save their own API key locally, validate it through pluggable logic, and choose from the provider’s supported models.

## Documentation posture

- `README.md` introduces the package and its purpose
- `docs/system-spec.md` defines architectural guardrails, capability boundaries, and expected behavior
- `.plans/` contains phased implementation plans for building the package incrementally
