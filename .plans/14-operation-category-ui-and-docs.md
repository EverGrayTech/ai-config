# Plan 14: Operation-category UI, documentation, and validation

## Goal

Complete the operation-category routing feature by covering the user-facing React settings experience, documentation updates, and validation/testing required to make the new routing model understandable and safe to adopt.

This companion plan intentionally separates the user-surface and quality work from the underlying headless routing/state changes so the effort stays focused without mixing architecture refactors with UI and documentation polish.

## Why this exists

The route-based model introduces new user-facing concepts:

- shared provider setup
- Default route versus category overrides
- inheritance when a category override is disabled
- explicit failure behavior when an enabled override is incomplete

Those concepts need a clear settings experience, updated downstream guidance, and targeted validation coverage to avoid confusion.

## Deployment and hosting constraints

- The package remains client-first and local-first.
- The React layer continues to be client-rendered browser UI.
- No new server dependency or deployment capability is introduced.
- Documentation and test guidance must stay consistent with the current static-export-friendly consumption posture.

## Relationship to Plan 13

Plan 13 owns the core routing model, app-definition extension, state normalization, persistence impact, and invocation resolution.

This plan depends on that headless foundation and focuses on presenting and validating the feature cleanly.

## Scope

### In scope

- React settings-panel restructuring for shared provider setup plus route overrides
- route-section expansion and collapse behavior
- advanced generation-settings collapse posture
- documentation updates across repo-facing and consumer-facing docs
- targeted automated tests for UI behavior and route semantics

### Out of scope for this plan

- redesigning provider credential storage ownership
- changing the agreed route-resolution semantics from Plan 13
- introducing non-React UI implementations

## Proposed implementation phases

### Phase 1: Restructure the settings UI around route concepts

- [x] Keep one `AIConfigPanel` as the single cohesive AI settings widget.
- [x] Introduce a clear separation between shared provider setup and route/model routing.
- [x] Render only Default route controls when the app does not declare categories.
- [x] Render Default plus one collapsible section per declared category when categories exist.
- [x] Keep category override sections disabled and collapsed by default.

### Phase 2: Reduce clutter while preserving control

- [x] Make advanced generation settings collapsed by default for Default and category routes.
- [x] Surface concise summaries when collapsed sections contain non-default generation values.
- [x] Ensure the UI clearly communicates when a category inherits Default versus uses its own override.
- [x] Avoid duplicating provider credential entry inside route sections.

### Phase 3: Documentation updates

- [x] Update downstream docs to explain operation categories and shared credentials.
- [x] Document `manager.invoke({ category })` behavior and undeclared-category rejection.
- [x] Document enabled-but-invalid override failure behavior.
- [x] Update usage examples to show both category-free and categorized apps.

### Phase 4: Validation and automated coverage

- [x] Add React tests for default-only and categorized settings-panel rendering.
- [x] Add tests for category enable/disable inheritance behavior.
- [x] Add tests for collapsed advanced-generation controls and summaries.
- [x] Add headless or integration-level tests that confirm the documented route semantics are reflected in user-visible behavior.

## Acceptance criteria

This plan is complete when:

- [x] the settings UI remains a single widget while supporting category overrides
- [x] provider credentials are configured in one shared place rather than duplicated per category
- [x] Default-only apps remain simple and uncluttered
- [x] categorized apps expose advanced flexibility without overwhelming first-time users
- [x] advanced generation controls are available but not prominent by default
- [x] documentation and tests clearly reflect the final category-routing behavior
