# Plan 16: Panel UX streamlining and demo overview refresh

## Goal

Make the default `AIConfigPanel` experience easier for non-technical users to understand while preserving the richer controls needed for advanced and validation-focused workflows.

Also update the demo app information architecture so the strongest validation surface becomes the primary overview experience.

## Why this exists

The current panel exposes too much information at once for first-time users:

- mode selection is more technical than it needs to be
- provider and model controls remain visible even when app-provided mode is active
- non-categorized apps still use “Default” route wording that implies concepts users do not see elsewhere
- generation settings are too prominent in the baseline experience
- app-provided usage copy adds clutter without helping most users complete a task

The demo app currently splits the simple composed view and the richer validation view across separate tabs, but the richer route-validation screen is a better baseline surface for product and UX review because it shows both the simple and categorized configurations together.

## Deployment/hosting constraints

- The package remains a client-first React/TypeScript library with browser-local persistence.
- The local demo app is a Vite client-rendered harness and must stay compatible with static-hosting-friendly usage.
- Hosted validation continues to rely on demo-owned environment variables for the deployed `ai-gateway` service rather than introducing repo-local server assumptions.

## Scope

### In scope

- replace the mode radio group with a simpler select/dropdown control
- support host-configurable app-provided mode wording such as “Free Trial”
- hide provider/model controls when app-provided mode is active
- keep non-categorized apps free of unnecessary “Default” route wording
- collapse generation settings by default in the primary panel experience
- reduce or remove app-provided usage copy that adds clutter
- make the richer route-validation screen the demo app’s primary overview surface
- update relevant docs if public UX expectations materially change

### Out of scope

- changing hosted/BYOK routing semantics
- introducing new backend requirements or a non-static demo architecture
- removing advanced controls that remain necessary for validation and power-user configuration

## Proposed implementation

### Phase 1: Panel progressive-disclosure cleanup

- [x] Replace `AIModeSelector` radios with a select-based control.
- [x] Ensure app-provided mode label remains host-configurable rather than hardcoded to a package-wide “Free Trial” fallback.
- [x] Hide provider/model controls entirely when app-provided mode is selected.
- [x] Reassess whether credential status/usage hint content should render only when it adds value to the active mode.

### Phase 2: Labeling and copy refinement

- [x] Use neutral “Provider” / “Model” labels when no operation categories exist.
- [x] Reserve “Default” route wording for categorized apps only.
- [x] Remove or significantly trim the app-provided usage copy that currently appears at the bottom of the panel.

### Phase 3: Advanced controls posture

- [x] Collapse generation settings by default in the baseline panel.
- [x] Preserve route/category-specific advanced controls for categorized apps and validation flows.

### Phase 4: Demo information architecture refresh

- [x] Promote the current route-validation screen to be the primary “Overview” screen in the demo.
- [x] Remove or retire the older simpler overview screen if it no longer adds distinct value.
- [x] Keep the side-by-side default-only and categorized examples available for validation.

### Phase 5: Validation and documentation

- [x] Verify demo behavior for both default-only and categorized examples after the UX changes.
- [x] Run repository quality checks relevant to the affected package/demo surface.
- [x] Update maintainer/consumer docs only where the public default UX expectations changed.

## Acceptance criteria

This plan is complete when:

- [x] the default panel presents a simpler first-run experience for non-technical users
- [x] app-provided mode hides provider/model controls entirely
- [x] non-categorized apps no longer show confusing “Default” terminology for top-level controls
- [x] generation settings are available but collapsed by default in the baseline experience
- [x] the noisy app-provided usage block is removed or materially reduced
- [x] the demo app’s primary overview surface shows both the simple and categorized validation harnesses
