# Development Guide

This document is the canonical maintainer workflow reference for `@evergraytech/ai-config`.

## Purpose

Use this guide when developing, validating, and maintaining the package inside this repository.

## Prerequisites

- Node.js compatible with the repo toolchain
- `pnpm` available on your machine

## Install

Install repo dependencies from the repository root:

```bash
pnpm install
```

The local demo app lives under `examples/demo-app/` and uses repo-installed dependencies plus its own local package manifest.

## Core commands

Run these from the repository root:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

## Local demo app

The repo includes a small local validation harness under `examples/demo-app/`.

### Start the demo app

From the repository root:

```bash
pnpm demo
```

### Build the demo app

```bash
pnpm demo:build
```

## Demo validation workflow

The demo app is organized to make future component validation straightforward:

- **Overview** — validate the composed `AIConfigPanel`
- **Component gallery** — validate individual exported components in focused compositions
- **State scenarios** — validate important state combinations such as default mode, BYOK mode, and saved-key states

When adding new components, prefer extending the gallery and state-scenarios screens rather than creating ad hoc demo pages.

## Styling validation workflow

The package supports two visual validation modes in the demo app:

1. **Neutral mode**
   - validates `@evergraytech/ai-config` with only this repo’s stylesheet
   - this is the default mode

2. **Design-system token simulation mode**
   - toggled inside the demo app
   - simulates the presence of EverGray Tech design-system CSS variables without creating a package dependency

This validates the optional CSS-variable bridging added in the package stylesheet.

## Documentation expectations

When package behavior changes, update the relevant docs:

- `README.md` for repo-level orientation
- `docs/consumption-guide.md` for downstream consumers
- `docs/system-spec.md` for architectural expectations when needed
- `.plans/` when implementation phases are added or completed

## Quality expectations

Before considering a change ready, verify:

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- demo behavior if React UI or styling changed

## Package entrypoints to keep in mind

- headless/core: `@evergraytech/ai-config`
- React layer: `@evergraytech/ai-config/react`
- stylesheet: `@evergraytech/ai-config/styles/base.css`
