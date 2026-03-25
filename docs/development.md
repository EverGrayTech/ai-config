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

Use PowerShell-safe separate commands rather than chaining with `&&` in this repo's Windows environment.

## Local demo app

The repo includes a small local validation harness under `examples/demo-app/`.

### Start the demo app

From the repository root:

```bash
pnpm demo
```

The default Vite dev server runs at `http://localhost:5173/`.

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

- [README.md](README.md) for repo-level orientation
- [Consumption Guide](docs/consumption-guide.md) for downstream consumers
- [System Spec](docs/system-spec.md) for architectural expectations when needed
- `.plans/` when implementation phases are added or completed

## Quality expectations

Before considering a change ready, verify:

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- demo behavior if React UI or styling changed

## Notes on current demo-tooling behavior

- `pnpm demo:build` currently succeeds, but Vite emits warnings about `'use client'` directives being ignored when bundling directly from package source files for the local demo harness.
- Those warnings are expected in this preview setup and do not affect the library build outputs.
- npm may also emit environment-config warnings inherited from repo-level npm configuration when `pnpm demo` or `pnpm demo:build` delegates to `npm --prefix`; these are noisy but non-blocking for the demo workflow.

## Releasing

### Bump the version number

```sh
npm version minor   # or patch/major
```

### Build and verify consumables

```sh
pnpm build
pnpm pack --dry-run
```

### Publish the package

```sh
npm publish
git push
git push --tags
```

### Consumer adoption

For downstream installation, upgrade guidance, public entrypoints, and usage posture, see [Consumption Guide](docs/consumption-guide.md).

The publishable package surface is defined by [package.json](package.json) exports and files configuration. Keep release validation aligned with the actual published entrypoints.

## Package entrypoints to keep in mind

- headless/core: `@evergraytech/ai-config`
- React layer: `@evergraytech/ai-config/react`
- stylesheet: `@evergraytech/ai-config/styles/base.css`
