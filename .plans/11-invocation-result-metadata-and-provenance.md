# Plan 11: Invocation result metadata and provenance

## Goal

Define the canonical successful invocation result shape for `@evergraytech/ai-config` so host apps can persist trustworthy provenance alongside generated outputs without separately re-reading config state.

## Why this exists

Plot Your Path needs generated outputs to carry enough metadata to answer:

- what provider produced this output?
- what model produced this output?
- what content should be stored as the result?

The package should make that metadata part of the invocation success contract by default.

## Core requirement

Every successful invocation result should include at least:

- provider identifier
- model identifier
- response content

When the hosted gateway path returns normalized usage data, the plan should also evaluate whether usage metadata belongs in the canonical success envelope or in an optional metadata sub-object.

The package may also define additional canonical metadata fields if they are stable and useful across both hosted and direct execution paths.

## Scope

### In scope

- one canonical success envelope shared across hosted and BYOK/direct invocation paths
- required provenance fields that hosts can persist directly
- optional canonical labels or version metadata when the package considers them stable and useful
- guidance that the invocation result is the primary provenance source for stored outputs

### Out of scope for this plan

- exact provider billing or token accounting
- analytics pipelines
- workflow/session provenance across multiple turns
- highly provider-specific metadata that cannot be normalized safely

## Design expectations

### Required metadata posture

The result contract should:

- identify the effective provider used for execution
- identify the effective model used for execution
- include the generated content in a host-consumable field
- avoid forcing hosts to inspect config state after the invocation completes

### Optional metadata evaluation

The plan should explicitly evaluate whether to include:

- execution path metadata such as `hosted` vs `byok-direct`
- canonical provider/model labels for human-readable provenance
- stable request/response identifiers from gateway or provider integrations where appropriate
- normalized usage metadata such as `inputTokens`, `outputTokens`, and `totalTokens` when returned by the gateway or a provider adapter
- package-defined schema/version markers for result persistence compatibility

Only metadata that is stable across the shared stack should be promoted into the canonical success contract.

## Proposed implementation phases

### Phase 1: Define the canonical success envelope

- [x] Introduce the shared invocation success type.
- [x] Separate required provenance fields from optional extended metadata.
- [x] Keep the contract small enough for broad host adoption.

### Phase 2: Normalize hosted and direct execution outputs

- [x] Map hosted gateway responses into the canonical success envelope.
- [x] Map direct-provider responses into the same envelope.
- [x] Ensure provider/model metadata reflects the actual execution path rather than stale host assumptions.
- [x] Decide whether gateway-provided usage should be canonical, optional, or pass-through metadata.

### Phase 3: Document provenance usage

- [x] Document that host apps should persist invocation metadata from the result contract itself.
- [x] Add examples showing how downstream apps store response content plus provenance together.
- [x] Clarify which metadata fields are canonical versus best-effort.

## Acceptance criteria

This plan is complete when:

- [x] successful invocations return a canonical shared success envelope
- [x] the envelope always includes provider id, model id, and response content
- [x] host apps can persist that result as trustworthy provenance without separately querying config state
- [x] hosted and direct execution paths normalize into the same success contract
- [x] any included usage or response-id metadata is clearly documented as canonical or optional
