# Plan 13: Operation-category model routing with shared provider credentials

## Goal

Extend `@evergraytech/ai-config` so host apps can define multiple categories of AI operations that may use different provider/model/generation settings while still presenting a single, cohesive AI settings experience.

The desired outcome is that apps can keep a simple default route for most users, while allowing optional category-specific overrides for advanced users and app-specific workflows.

## Why this exists

Some host apps perform different kinds of AI work such as evaluation, writing, or utility tasks.

Those operations may benefit from different model selections, but exposing a completely separate AI settings surface for each operation would create too much setup friction and visual clutter.

This plan introduces a route-based model where:

- there is always one Default route
- apps may optionally declare named operation categories
- each category may inherit Default or opt into its own route settings
- provider credentials remain shared globally by provider rather than being duplicated per category

## Deployment and hosting constraints

- The package remains client-first and local-first.
- Persisted configuration continues to live in browser storage by default.
- No new backend capability is required.
- The feature must remain compatible with current client-rendered React usage and static-export-friendly consumption.

## Product decisions locked for this plan

- Undeclared categories passed to invocation are a developer error and must be rejected rather than silently falling back.
- If a category override is explicitly enabled but invalid or incomplete, invocation must return a structured configuration error rather than silently using Default.
- Category sections expose model controls only: provider, model, and generation settings.
- Provider credential entry and validation remain shared and global by provider.
- Advanced generation controls should be collapsed by default to reduce UI clutter.

## Architectural update

The current package state model centers on a single active provider/model/generation selection.

This plan evolves that posture toward **route-based configuration**:

- one shared provider-credential layer
- one Default route
- zero or more optional category override routes

Each route represents model-selection behavior, not credential ownership.

## Scope

### In scope

- optional app-definition support for declaring operation categories
- route-setting types for Default and category overrides
- state normalization and persistence for route-based settings
- route resolution helpers for invocation
- manager invocation support for optional category selection
- React UI updates for shared provider setup plus route override controls
- documentation and test coverage for inheritance and override behavior

### Out of scope for this plan

- per-category credential storage
- multiple independent provider-configuration surfaces
- non-React UI implementations beyond headless state support
- advanced orchestration beyond choosing the effective route for one invocation

## Proposed implementation phases

### Phase 1: Extend app-definition and route types

- [ ] Introduce a typed app-definition shape for optional operation categories.
- [ ] Define route-setting types for Default and category override records.
- [ ] Preserve backward compatibility for apps that declare no categories.
- [ ] Keep credential ownership global by provider.

### Phase 2: Refactor state, merge logic, and persistence

- [ ] Replace the single active provider/model/generation posture with route-based settings.
- [ ] Add normalization rules for missing, stale, or invalid category route values.
- [ ] Ensure disabled category overrides inherit Default without duplicating resolved state.
- [ ] Preserve safe recovery behavior for persisted payloads that predate category routing.

### Phase 3: Add effective-route resolution and invocation support

- [ ] Extend invocation request shape to accept an optional category identifier.
- [ ] Resolve the effective route before hosted or direct-provider invocation.
- [ ] Reject undeclared categories with a structured error contract.
- [ ] Return structured configuration errors when an enabled category override is incomplete or invalid.
- [ ] Keep Default invocation behavior unchanged when categories are absent or no category is requested.

### Phase 4: Restructure React settings UI around shared setup and routing

- [ ] Keep a single `AIConfigPanel` as the app-facing settings composition.
- [ ] Separate shared provider credential setup from route/model routing controls.
- [ ] Show only Default route controls when the app has no categories.
- [ ] Show Default plus collapsible category override sections when categories are declared.
- [ ] Make category overrides opt-in with an enable/disable control.
- [ ] Collapse advanced generation controls by default within each route section.
- [ ] Surface lightweight summaries for collapsed generation controls when non-default values are set.

### Phase 5: Documentation and quality coverage

- [ ] Update docs to explain shared provider credentials plus route-based model selection.
- [ ] Document invocation behavior for undeclared categories and enabled-but-invalid overrides.
- [ ] Add tests for inheritance, route normalization, category rejection, and route-based invocation.
- [ ] Add React tests for default-only and categorized settings-panel behavior.

## Acceptance criteria

This plan is complete when:

- [ ] apps can optionally declare operation categories without breaking existing integrations
- [ ] provider credentials are configured once and reused across Default and category routes
- [ ] category overrides may choose different providers and models from Default
- [ ] disabled category overrides inherit Default behavior
- [ ] enabled but invalid category overrides fail clearly rather than silently falling back
- [ ] undeclared invocation categories are rejected as structured errors
- [ ] the settings UI remains a single cohesive widget and avoids unnecessary clutter
