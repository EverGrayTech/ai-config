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
- a thin unified invocation surface for hosted and BYOK execution
- optional React components for settings UIs

It is not intended to be the full AI execution runtime. It manages configuration, user preferences, provider metadata, invocation routing, and related UX concerns so host apps can integrate AI features with less duplication.

## Core capabilities

- zero-setup default mode for app-provided AI access
- bring-your-own-key workflows for supported providers
- provider and model selection
- generation settings such as temperature and output limits
- optional operation-category routing with shared provider credentials
- local credential storage and management
- rough usage and cost-awareness messaging
- unified invocation routing across hosted and BYOK paths
- headless and React-friendly integration paths

## Installation

```bash
pnpm add @evergraytech/ai-config react
```

Use the headless API from `@evergraytech/ai-config`, the optional React layer from `@evergraytech/ai-config/react`, and the base stylesheet from `@evergraytech/ai-config/styles/base.css`.

## Documentation map

- [Consumption Guide](docs/consumption-guide.md) — canonical downstream integration guide
- [Development](docs/development.md) — canonical maintainer workflow guide
- [System Spec](docs/system-spec.md) — architectural guardrails and capability boundaries

## Quick start

- install: `pnpm add @evergraytech/ai-config react`
- import core APIs from `@evergraytech/ai-config`
- import React APIs from `@evergraytech/ai-config/react`
- import styles from `@evergraytech/ai-config/styles/base.css`

## Headless invocation posture

The headless layer now includes a thin package-owned invocation surface.

- call `manager.invoke()` to route against the currently configured AI path
- default hosted execution is expected to use an `@evergraytech/ai-gateway` adapter supplied through manager options
- BYOK execution is expected to use a direct-provider client registry supplied through manager options
- successful invocations return normalized provenance metadata such as provider, model, output, execution path, and optional usage/labels
- failed invocations return a structured error contract with normalized category/code/message/retryability fields

This is still intentionally narrower than a full runtime or orchestration framework.

## Operation-category routing posture

Apps can optionally declare named AI operation categories such as evaluation or writing.

- the package keeps one shared credential store per provider
- the Default route remains the baseline provider/model/generation path
- each category can inherit Default or opt into its own override route
- `AIConfigPanel` stays a single settings widget even when categories are enabled
- `manager.invoke({ category })` resolves the effective route and rejects undeclared categories with structured configuration errors

This keeps default integrations simple while allowing advanced apps to route different tasks through different model selections.

For full integration guidance, examples, styling guidance, and host-app customization, use [Consumption Guide](docs/consumption-guide.md).

## React integration posture

The optional React layer is browser/client-first.

- render `AIConfigProvider` and React consumers inside a client component boundary
- import `@evergraytech/ai-config/styles/base.css` anywhere the packaged UI is used
- expect persisted settings to load from `localStorage` after client mount
- embed `AIConfigPanel` inside existing settings layouts by default, or opt into package framing with `framed`
- use exported hooks such as `useAIConfigState()` when host-owned UI needs to read current AI config outside the packaged panel

For local repo workflows and the in-repo demo harness, use [Development](docs/development.md).

## Local-first credential caveat

This package intentionally supports storing provider API keys locally in the user’s browser/device context.

That is a usability tradeoff, not a server-grade security model.

- credentials stored through this package are not equivalent to secure server-side secret storage
- the package should avoid logging raw secrets and should provide redaction helpers
- consuming apps should clearly communicate that locally stored keys remain under the user’s device/browser security posture

## Intended package shape

The package is expected to be delivered as one publishable package with two logical layers:

- headless/core exports for state, storage, registries, validation, invocation, and utilities
- optional React exports for hooks, context, and settings components

## Local development

For repo workflows, quality checks, and the in-repo demo app, see [Development](docs/development.md).
