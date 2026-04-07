# Plan 23: Direct settings-page surface and package-owned setup messaging

## Goal

Make `@evergraytech/ai-config` the direct, first-class React settings surface for downstream apps so products like `plot-your-path` no longer need local wrapper layers such as `AISettingsPanel.tsx` just to provide page-ready structure, setup-required messaging, or light composition around the existing controls.

This plan adds a package-owned settings-page-ready assembled surface, package-owned setup-required messaging, and composable primitives that let host apps render the AI settings experience directly from `@evergraytech/ai-config/react`.

## Why this exists

The current React layer already exposes `AIConfigProvider`, `AIConfigPanel`, and several lower-level form controls. However, the downstream integration posture still leaves important ownership gaps:

- app wrappers are still needed to add a settings title and description
- app wrappers are still needed to decide what to show when hosted gateway/client configuration is missing
- the current assembled panel is primarily a controls composition, not the full preferred settings-page-ready surface
- downstream apps can end up with duplicated route-level page headings, nested section titles, or extra card framing just to present package-owned functionality

For the direct-consumption goal, the package should own the reusable AI settings messaging and composition contract so host apps can render package UI directly with only route-level placement.

## Deployment and hosting constraints

- The package remains client-first and localStorage-backed.
- The React layer must remain usable from Next.js app-router client components.
- No new server runtime, backend-only dependency, or non-static-friendly integration step may be introduced.
- Setup-state detection and rendering must remain compatible with client-rendered usage and static-export-friendly downstream apps.
- The package should continue to work when embedded inside a host-owned settings route or card without assuming full-page ownership.

## Scope

### In scope

- add a new preferred assembled React settings surface intended for direct settings-page consumption
- expose composable primitives for settings header/title, description/help text, setup-required state, and main controls
- move missing hosted configuration/setup messaging into package-owned React UI
- allow apps to pass concrete configuration labels/values needed for the package-owned setup-required message
- keep `AIConfigPanel` available as a lower-level/back-compat controls composition
- update docs and examples to show direct package rendering without local wrappers
- add migration guidance for consumers currently wrapping the package for headings/setup messaging

### Out of scope

- introducing app-specific copy ownership back into consuming apps
- requiring server-rendered configuration resolution
- turning the React layer into a rigid full-page shell that owns route-level layout
- removing existing lower-level component exports that consumers may already use

## Product and API direction

### Confirmed decisions

- The preferred direct-use React surface should be a **new assembled component**, not just the existing `AIConfigPanel` with extra documentation.
- `AIConfigPanel` should remain available as a lower-level or back-compat controls composition.
- The package should expose **composable primitives** in addition to the assembled surface.
- Setup-required messaging should remain **package-owned**, with apps allowed to supply only concrete config data/labels rather than replacing the message copy.

### Intended usage posture

The desired host-side shape should be approximately:

1. route/page decides placement only
2. host renders `AIConfigProvider`
3. host renders the new package-owned assembled settings component directly

Hosts that need finer control should be able to compose package-owned pieces directly without rebuilding the messaging contract themselves.

## Proposed implementation phases

### Phase 1: Define the new direct-consumption React API

- [x] introduce a new top-level assembled settings component intended as the preferred direct-use surface
- [x] define a package-owned header/title primitive and description/help primitive that share styling with the assembled surface
- [x] define a package-owned setup-required state primitive
- [x] define the boundary between the new assembled surface and the existing `AIConfigPanel`
- [x] export the new surface and primitives from `@evergraytech/ai-config/react`

### Phase 2: Package-owned setup-state detection and messaging

- [x] determine the missing hosted configuration cases the package should detect for direct-use settings rendering
- [x] render a package-owned setup-required state when required gateway/client configuration is absent or incomplete
- [x] keep message wording generic/productized while allowing apps to pass concrete config identifiers or values as structured props
- [x] ensure setup-state rendering is reusable both inside the new assembled surface and as a standalone composable primitive

### Phase 3: Refactor composition without duplicative nesting

- [x] keep the new assembled surface settings-page-ready without imposing nested card-inside-card or repeated heading patterns
- [x] ensure apps can render package-owned header + description + setup state + controls as separate pieces with consistent styling
- [x] keep `AIConfigPanel` focused on the controls body and route/category configuration behavior
- [x] preserve compatibility for categorized apps and current route-specific controls

### Phase 4: Styling and integration contract updates

- [x] add or refine stable class/data hooks for the new assembled surface and composable primitives
- [x] preserve design-system-compatible styling and avoid hard-coded outer framing assumptions
- [x] document when to use the new assembled surface versus lower-level composition with `AIConfigPanel`
- [x] confirm the integration remains friendly to Next.js app routes and other client-rendered hosts

### Phase 5: Downstream adoption and migration documentation

- [x] update consumer docs to show direct package rendering with `AIConfigProvider` plus the new assembled surface
- [x] add example usage showing removal of a local wrapper component like `AISettingsPanel.tsx`
- [x] document migration guidance for apps currently providing their own settings title/description/setup wrapper
- [x] update demo/example usage if needed to validate the new direct-consumption posture

### Phase 6: Validation

- [x] run `pnpm biome check --write`
- [x] run `pnpm test`
- [x] run `pnpm build`
- [x] validate the demo app or examples if React styling/composition changed materially

## Expected component posture

The React package surface should end this plan with two clear consumption paths.

### Preferred direct-use path

A new assembled component should provide the package’s recommended settings-page-ready AI settings experience, including:

- package-owned heading/title block
- package-owned explanatory description/help copy
- package-owned setup-required state when configuration is missing
- the main AI configuration controls composition

This assembled surface should be ready to drop into a host settings page section without requiring another local wrapper just to make it understandable.

### Composable path

Lower-level exported primitives should let a host render package-owned pieces individually, such as:

- settings header/title block
- settings description/help text
- setup-required state
- controls body / `AIConfigPanel`

These pieces should share visual language and behavior so hosts can rearrange them without re-implementing package-owned semantics.

## Acceptance criteria

This plan is complete when:

- [x] a downstream app can render the AI settings experience directly from `@evergraytech/ai-config/react` without a local wrapper for title/description/setup messaging
- [x] missing hosted gateway/client configuration is surfaced by package-owned UI rather than app-owned wrapper logic
- [x] the package exposes both a convenient assembled settings surface and individually composable pieces
- [x] the assembled surface avoids duplicated nested card/title/description patterns when embedded in a host settings route
- [x] docs include direct-use examples, wrapper-removal guidance, and migration notes for current consumers
- [x] validation passes for the package change

## Out-of-scope cautions

- Do not require host apps to adopt a new server-side configuration layer.
- Do not make the assembled surface the only viable API; composition must remain supported.
- Do not let setup-required messaging drift into app-specific copy ownership.
- Do not break existing `AIConfigPanel` consumers unless a clearly documented compatibility path is provided.
