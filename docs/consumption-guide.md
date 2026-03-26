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
- BYOK execution is expected to route directly to the selected provider through a host-supplied direct-provider client boundary
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

Current scope notes:

- hosted/default invocation uses the gateway adapter boundary and maps to the gateway `input` contract
- BYOK invocation uses a direct-provider client registry supplied to the manager
- token refresh/retry handling is not fully implemented yet
- the current result shape is intentionally minimal and will be expanded by the follow-on metadata and structured-error plans

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
