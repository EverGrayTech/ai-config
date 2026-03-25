# Plan: Polish, Testing, and Release Readiness

## Objective
Harden `@evergraytech/ai-config` for v0 reuse by completing testing, documentation, recovery behavior, accessibility polish, and package-readiness tasks required for dependable adoption across EverGray Tech applications.

## Customer Value
- Increases confidence that shared AI configuration behavior works consistently across apps
- Reduces integration risk by documenting recovery behavior, caveats, and customization paths clearly
- Improves maintainability and release quality for a package intended for internal reuse

## Scope Decisions (Locked)
- This plan focuses on quality, completeness, and release readiness rather than introducing major new feature areas
- Testing must prioritize durable behavior around state, storage, validation, and accessibility
- Documentation should serve both package adopters and maintainers
- Release readiness includes package-surface clarity, not just passing tests

## Prerequisites
- `docs/system-spec.md`
- `.plans/01-headless-foundation.md`
- `.plans/02-provider-registry-and-validation.md`
- `.plans/03-react-integration-and-settings-ui.md`

## Implementation Checklist

### 1. Core and Validation Tests
- [x] Add automated tests for initialization, mode/provider/model switching, credential management, and merge precedence
- [x] Add persistence tests for load/save/clear behavior, corrupted storage recovery, and schema-version handling
- [x] Add validation and sanitization tests covering success, invalid, error, and redaction behavior

### 2. React and Accessibility Tests
- [x] Add React tests covering main panel rendering and controlled interactions
- [x] Add accessibility-oriented tests for labeling, error communication, and keyboard-friendly behavior
- [x] Verify state updates remain consistent with persistence and registry rules in React usage flows

### 3. Documentation and Examples
- [x] Expand repository docs with installation, headless usage, React usage, customization, and provider/model registration examples
- [x] Document local-first security caveats, persistence behavior, versioning posture, and theming guidance clearly
- [x] Ensure public API and package-boundary guidance remain consistent across README, system spec, and examples

### 4. Recovery and Edge-Case Hardening
- [x] Verify graceful fallback behavior when providers or models become unavailable
- [x] Verify reset behaviors for package defaults, app defaults, credentials-only clearing, and full persisted-state clearing
- [x] Confirm migration and normalization behavior is predictable and documented

### 5. Package and Release Readiness
- [x] Review exported surface for clarity, tree-shakeability, and separation between public and internal modules
- [x] Ensure package metadata and build/test scripts support internal publishing and consumption expectations
- [x] Validate the package against the documented v0 acceptance posture before release

## Acceptance Criteria
- [x] Automated tests cover the core state, validation, persistence, and React interaction expectations for v0
- [x] Documentation is sufficient for a host app to adopt the package with either headless or React usage
- [x] Recovery and reset behaviors are verified and documented clearly
- [x] The package export surface and metadata are ready for internal publication and reuse
- [x] The repository meets the documented v0 acceptance posture for `@evergraytech/ai-config`
