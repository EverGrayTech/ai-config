# Consumption Guide

This document is the canonical entrypoint for downstream developers integrating `@evergraytech/ai-config`.

## What this package is for

`@evergraytech/ai-config` provides a reusable, local-first AI configuration layer for TypeScript and React applications, plus a thin unified invocation surface for hosted and bring-your-own-key execution.

It helps host apps:

- offer a zero-setup app-provided AI mode
- support bring-your-own-key provider workflows
- persist AI settings locally in the browser
- present provider/model/settings management consistently across products
- invoke the currently configured AI without re-owning provider/model/credential routing

It is not the full AI execution runtime or orchestration framework.

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

## Unified invocation posture

The headless layer now supports a thin package-owned invocation surface.

- host apps can call the currently configured AI through the package manager
- default hosted execution is expected to route through `@evergraytech/ai-gateway`
- BYOK execution is expected to route through `@evergraytech/ai-gateway` using the explicit BYOK request shape
- the package owns invocation routing, but not a full chat runtime, workflow engine, or agent framework

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

## Headless invocation usage

The initial invocation surface is manager-based.

```ts
import { createAIConfigManager, type AIConfigAppDefinition } from '@evergraytech/ai-config';

const appDefinition: AIConfigAppDefinition = {
  appId: 'plot-your-path',
  defaultMode: {
    enabled: true,
    label: 'EverGray hosted AI',
    provider: 'hosted',
    model: 'gpt-4o-mini',
  },
  byok: {
    enabled: true,
    providers: ['openai'],
  },
};

const manager = createAIConfigManager({
  appDefinition,
  hostedGateway: {
    clientId: 'stable-client-id',
    gateway: {
      authenticate: async ({ appId, clientId }) => ({ token: `${appId}:${clientId}` }),
      invoke: async ({ input, provider, model }) => ({
        provider: provider ?? 'openai',
        model: model ?? 'gpt-4o-mini',
        output: `Hosted response for: ${input}`,
      }),
    },
  },
});

const invokeResult = await manager.invoke({ input: 'Summarize this page.' });

if (!invokeResult.ok) {
  console.error(invokeResult.code, invokeResult.message);
} else {
  console.log(invokeResult.executionPath, invokeResult.provider, invokeResult.model, invokeResult.output);
}
```

## Operation-category routing

Apps with multiple AI workflows can declare `operationCategories` while still keeping one shared AI settings widget and one shared credential store per provider.

- the **Default** route remains the baseline provider/model/generation path
- each declared category can either inherit Default or enable its own override
- provider credentials remain shared globally by provider and are not duplicated per category

Example categorized app definition:

```ts
import type { AIConfigAppDefinition } from '@evergraytech/ai-config';

const appDefinition: AIConfigAppDefinition = {
  appId: 'plot-your-path',
  defaultMode: {
    enabled: true,
    label: 'EverGray hosted AI',
    provider: 'hosted',
    model: 'gpt-4o-mini',
  },
  byok: {
    enabled: true,
    providers: ['openai', 'anthropic'],
  },
  operationCategories: [
    { key: 'evaluate', label: 'Evaluate' },
    { key: 'write', label: 'Write' },
  ],
};
```

In the packaged React UI:

- apps without categories show only Default route controls
- apps with categories show Default controls plus one collapsible section per category
- category overrides start disabled and inherit Default until explicitly enabled
- advanced generation controls are collapsed by default to reduce clutter

When a collapsed generation section contains non-default values, the panel surfaces a short summary so users can see that a route differs without opening every section.

## Category-aware invocation

Hosts can invoke a category-specific route through `manager.invoke({ category })`.

```ts
const result = await manager.invoke({
  input: 'Score this answer for factual accuracy.',
  category: 'evaluate',
});
```

Behavior guarantees:

- if `category` is omitted, invocation uses the Default route
- if a declared category override is disabled, invocation inherits Default
- if an undeclared category is provided, invocation fails with a structured `invalid-category` configuration error
- if an override is enabled but incomplete or invalid, invocation fails with a structured configuration error instead of silently falling back to Default

Current scope notes:

- hosted/default invocation uses the gateway adapter boundary and maps to the gateway `input` contract
- BYOK invocation uses the same gateway-mediated `/ai` surface and sends provider + model + credential together
- token refresh/retry handling is not fully implemented yet
- successful invocation results now include canonical provider/model/output fields plus execution-path metadata, optional human-readable labels, and optional normalized usage when provided by the hosted gateway or provider adapter

## Invocation result metadata

Successful invocations return a shared success envelope intended to be stored directly as provenance metadata alongside generated outputs.

Canonical success fields include:

- `provider`
- `model`
- `output`
- `executionPath`

Additional best-effort metadata may include:

- `providerLabel`
- `modelLabel`
- `usage.inputTokens`
- `usage.outputTokens`
- `usage.totalTokens`

Host apps should prefer persisting the invocation result metadata itself rather than separately inspecting config state after generation completes.

## Invocation error contract

Failed invocations return a structured error envelope intended to be safe for direct host-app UI handling.

Structured error fields include:

- `category` — broad failure classification such as `configuration`, `authentication`, `network`, or `provider`
- `code` — package-normalized failure code
- `message` — host-displayable message
- `retryable` — whether retry is plausibly safe

Current normalized errors cover configuration failures, hosted auth failures, hosted invocation failures, token-refresh failures, and gateway-mediated BYOK invocation failures.

The package does not silently fall back to fake or local generation when invocation fails.

Host apps should surface these structured failures directly rather than rebuilding provider-specific error normalization layers.

## React usage

The packaged React layer is intended for client-rendered browser settings UI.

- `AIConfigProvider` and any components or hooks from `@evergraytech/ai-config/react` should live in a client component.
- Persisted state is loaded from `localStorage`, so saved user config becomes available after client mount.
- In hosts such as Next.js App Router, do not depend on persisted AI config being available during server render or static generation.
- Static export is supported as long as the package is used as client-rendered UI and no server-only persistence assumption is introduced.

```tsx
'use client';

import '@evergraytech/ai-config/styles/base.css';
import {
  AIConfigPanel,
  AIConfigProvider,
  useAIConfigState,
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
      <section>
        <h2>AI settings</h2>
        <p>Choose whether to use app-provided AI or your own provider key.</p>
        <AIConfigPanel />
      </section>
    </AIConfigProvider>
  );
}

export function AISettingsStatus() {
  const state = useAIConfigState();

  return <p>Current provider: {state.selectedProvider ?? 'none selected'}</p>;
}
```

Categorized apps can keep the same top-level panel while exposing route-specific overrides:

```tsx
'use client';

import '@evergraytech/ai-config/styles/base.css';
import { AIConfigPanel, AIConfigProvider } from '@evergraytech/ai-config/react';
import type { AIConfigAppDefinition } from '@evergraytech/ai-config';

const categorizedDefinition: AIConfigAppDefinition = {
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
  operationCategories: [
    { key: 'evaluate', label: 'Evaluation' },
    { key: 'write', label: 'Writing' },
  ],
};

export function CategorizedAISettingsCard() {
  return (
    <AIConfigProvider appDefinition={categorizedDefinition}>
      <AIConfigPanel />
    </AIConfigProvider>
  );
}
```

## Embedding inside an existing Settings page

`AIConfigPanel` is intended to work as a section-level building block, not as a full-page shell.

- Host apps can render their own headings, trust-model copy, and adjacent settings sections before or after the panel.
- By default, `AIConfigPanel` is layout-neutral and does not add card framing.
- If a host wants package-provided framing for a standalone presentation, it can render `<AIConfigPanel framed />`.
- Host apps that need more control can compose lower-level exported components or use the headless layer directly.

## Styling usage

Import the package stylesheet:

```ts
import '@evergraytech/ai-config/styles/base.css';
```

The package provides stable styling hooks including:

- `.eg-ai-config-panel`
- `.eg-ai-config-section`
- `.eg-ai-config-field`
- `.eg-ai-config-actions`
- `.eg-ai-config-control`
- `.eg-ai-config-button`
- `.eg-ai-config-status`

Stable data-attribute hooks include:

- `data-eg-ai-config-panel`
- `data-eg-ai-config-framed`
- `data-eg-ai-config-section`
- `data-eg-ai-config-field`
- `data-eg-ai-config-actions`
- `data-eg-ai-config-action`

Host apps can override the package styling either by targeting those hooks directly or by overriding the exposed AI-scoped CSS variables.

Framing guidance:

- render `AIConfigPanel` directly inside an existing app card or section when the host owns outer spacing and borders
- use `framed` only when the package should render its own card-like container
- prefer overriding AI-scoped CSS variables or stable hooks rather than depending on incidental internal DOM structure

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
- operation-category declarations and labels
- model filtering and curation
- provider ordering and overrides
- validation behavior
- storage adapter replacement

Host apps may also choose to consume only the headless layer and build their own UI entirely.

## Reading state outside the panel

Host-owned React components can read current AI configuration without bypassing package ownership.

- use `useAIConfigState()` to read the current selected mode, provider, model, credentials, and generation settings
- use `useAIConfig()` when host code also needs access to the manager instance
- use `useAIConfigActions()` to trigger supported updates through the packaged ownership model

For non-React integrations, hosts can supply their own manager instance to `AIConfigProvider` and subscribe through the headless manager API.

## Config change notifications

Hosts that need analytics labels or other side effects on meaningful config changes can provide `onChange` to `AIConfigProvider`.

The callback receives the next resolved config state after package-managed updates. This is intended for read-only side effects such as analytics, copy refresh, or downstream labeling, not for replacing the package as the source of truth.

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
