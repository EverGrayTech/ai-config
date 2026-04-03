# Plan 22: Package entrypoint declaration alignment

## Goal

Resolve the published package entrypoint mismatch that blocks downstream TypeScript adoption of `@evergraytech/ai-config@0.2.0`.

The package metadata currently declares top-level declaration entrypoints for both the headless and React surfaces, but the emitted declaration files in the published build are nested under `dist/src/`. This mismatch must be corrected so downstream consumers can resolve the package types from the documented public entrypoints.

## Why this exists

A downstream adopter continuing plan 62 reported that the installed package metadata points to:

- `dist/index.d.ts`
- `dist/react.d.ts`

But the actual published build contains:

- `dist/src/index.d.ts`
- `dist/src/react.d.ts`

That makes the published package internally inconsistent and creates a package-level blocker for consumers relying on the documented imports:

- `@evergraytech/ai-config`
- `@evergraytech/ai-config/react`

Per the repo’s downstream-first validation posture, this must be handled as an upstream package fix rather than a consumer-side workaround.

## Deployment/hosting constraints

- The package remains a publishable TypeScript library with separate headless and React entrypoints.
- The fix must preserve the existing public import surface for downstream consumers.
- The work must not introduce any new server runtime, backend dependency, or hosting-model assumption.
- Release validation should remain aligned with the actual published package contents and `package.json` exports metadata.

## Scope

### In scope

- identify why declaration output currently lands under `dist/src/`
- align emitted declaration paths and JavaScript entrypoints with `package.json` `main`, `types`, and `exports`
- ensure the published package contains declaration files at the paths promised by package metadata, or update metadata to the intentional paths if that is the correct release posture
- validate the resulting consumable package shape using the existing maintainer workflow
- document the issue as a required upstream fix for downstream adopters until a corrected release is published

### Out of scope

- changing the documented public import specifiers
- introducing consumer-specific aliases or local install workarounds as the primary solution
- expanding package scope beyond correcting the release artifact and metadata alignment problem

## Proposed implementation

### Phase 1: Build-output diagnosis

- [x] inspect the TypeScript build configuration and emitted output structure to determine why root entry files are published under `dist/src/`
- [x] confirm whether the mismatch affects only declaration files or also the JavaScript entrypoint paths promised by `main` and `exports`
- [x] verify the exact package shape produced by the current build and pack flow

### Phase 2: Entry-point alignment

- [x] update the build and/or packaging configuration so the published top-level package entrypoints match the actual emitted files
- [x] preserve the intended public package surface for `.` and `./react`
- [x] avoid introducing release metadata that points consumers at incidental internal source-layout paths unless that layout is intentionally part of the release design

### Phase 3: Release validation

- [x] run the canonical repository validation commands required for a package change
- [x] verify the corrected output against `pnpm pack --dry-run`
- [x] confirm the produced package contents and metadata are internally consistent for downstream installation

### Phase 4: Adoption unblock documentation

- [x] record that downstream work should pause on this issue until a corrected package version is published
- [x] update any release-readiness or consumer-facing documentation that needs to reflect the corrected package consumable shape

## Acceptance criteria

This plan is complete when:

- [x] the package metadata no longer points at missing declaration files
- [x] the published headless and React entrypoints are internally consistent across JS and type artifacts
- [x] a downstream TypeScript consumer can import `@evergraytech/ai-config` and `@evergraytech/ai-config/react` without entrypoint-resolution failures caused by package metadata
- [x] pack/release validation confirms the shipped files match the documented public package surface
- [x] the blocker is documented as resolved by an upstream release rather than left to consuming apps to patch around

## Resolution notes

- The package build now emits public root entry artifacts at the paths promised by `package.json`, including `dist/index.d.ts`, `dist/index.js`, `dist/react.d.ts`, and `dist/react.js`.
- Validation completed successfully with `pnpm test`, `pnpm build`, `pnpm biome check .`, and `pnpm pack --dry-run`.
- Downstream adopters should treat this blocker as resolved by the upstream package fix and consume the next corrected published release rather than applying consumer-local path workarounds.
- Consumer-facing and maintainer docs were updated in `README.md`, `docs/consumption-guide.md`, and `docs/development.md` to reflect the corrected public entrypoints and release-validation expectations.
