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

For full integration guidance, examples, styling guidance, and host-app customization, use [Consumption Guide](docs/consumption-guide.md).

For local repo workflows and the in-repo demo harness, use [Development](docs/development.md).

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

## Local development

For repo workflows, quality checks, and the in-repo demo app, see [Development](docs/development.md).
