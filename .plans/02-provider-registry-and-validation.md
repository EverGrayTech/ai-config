# Plan: Provider Registry and Validation

## Objective
Define the provider/model registry and validation architecture for `@evergraytech/ai-config` so host apps can enable curated AI options, manage provider metadata, and validate bring-your-own-key credentials through pluggable behavior.

## Customer Value
- Gives EverGray Tech apps a reusable way to expose consistent provider/model choices
- Supports power-user BYOK workflows without forcing provider-specific logic into each app
- Keeps provider metadata, validation behavior, and cost/usage hints organized in one extensible system

## Scope Decisions (Locked)
- This plan focuses on provider/model metadata and validation contracts, not full inference execution
- Built-in providers should be modest and opinionated enough for v0, while remaining override-friendly
- Validation behavior must be pluggable rather than tied to a single network strategy
- Model metadata should support UX decisions, but not promise exact provider parity or pricing accuracy

## Prerequisites
- `docs/system-spec.md`
- `.plans/01-headless-foundation.md`

## Implementation Checklist

### 1. Provider Definitions
- [x] Define provider-definition contracts covering labels, BYOK support, credential hints, docs/help text, and validation hooks
- [x] Seed the initial built-in provider set for OpenAI, Anthropic, Google, and OpenRouter
- [x] Ensure provider ordering and host-level provider enablement can be controlled cleanly

### 2. Model Registry Behavior
- [x] Define model-descriptor contracts covering capabilities, context/output hints, status, and rough cost metadata
- [x] Implement provider-scoped model lookup and filtering behavior
- [x] Support host-app curation, aliasing, disabling, or override behavior for available models

### 3. Validation Interfaces
- [x] Define validation result contracts and validation execution interfaces
- [x] Implement provider-level and host-overridable validation pathways
- [x] Ensure validation results can be stored and surfaced without leaking raw secrets

### 4. Usage/Cost Awareness Utilities
- [x] Implement helper behavior for distinguishing app-provided mode from BYOK mode
- [x] Support host-provided free-tier messaging and model-level cost hints where metadata exists
- [x] Provide warning/copy helpers for higher-cost selections without attempting exact metering

### 5. Integration with Core State
- [x] Connect provider/model availability rules to normalization and selection behavior
- [x] Ensure invalid or unavailable stored providers/models fall back gracefully
- [x] Expose registry-aware helpers suitable for headless and future React usage

## Acceptance Criteria
- [x] Built-in providers and models can be queried through a reusable registry abstraction
- [x] Host apps can enable, filter, reorder, or override providers/models predictably
- [x] Validation is pluggable and stores safe result metadata without exposing credentials
- [x] Usage/cost messaging helpers support rough UX guidance without overreaching into metering
- [x] Registry behavior integrates cleanly with the headless state foundation
