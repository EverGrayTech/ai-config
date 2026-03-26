# Plan 12: Structured invocation errors

## Goal

Define a clear structured error contract for unified invocation so host apps can surface failures directly without reintroducing bespoke provider-specific or gateway-specific normalization logic.

## Why this exists

Plot Your Path needs failures to be explicit and trustworthy.

The package should:

- show failure clearly
- avoid silent fallback behavior
- avoid forcing each host app to normalize provider and gateway failures independently

## Core requirement

Failed invocations should return a structured error shape that is suitable for:

- host UI presentation
- application logging
- branch logic for retryability or remediation

The error shape should be normalized across both hosted gateway execution and BYOK direct-provider execution.

## Scope

### In scope

- one canonical invocation error contract
- normalized error categories spanning hosted and direct execution
- safe message and metadata fields appropriate for UI and logging
- explicit no-silent-fallback behavior

### Out of scope for this plan

- automatic retry orchestration
- circuit breakers or queueing systems
- provider-specific remediation UX beyond normalized error classification
- hidden fallback generation paths

## Error categories to evaluate

### Configuration and readiness failures

- no active mode available
- missing selected provider
- missing selected model
- missing credential for BYOK mode
- unsupported provider/model configuration
- unsupported execution path for the resolved mode

### Hosted gateway failures

- auth request failed
- invalid or expired hosted token
- missing or malformed bearer token
- malformed request rejected by gateway
- disallowed provider/model selection
- gateway default-path request rejected because the configured hosted default is unavailable or disallowed
- exceeded request-size or output-token bounds enforced by gateway policy
- hosted rate-limit or policy rejection
- gateway transport failure

### Direct-provider failures

- provider client not implemented
- provider rejected credential or request
- network/transport failure
- provider returned malformed or unprocessable data

### Unknown failures

- unclassified internal errors that still need a stable host-facing shape

## Design expectations

The structured error contract should:

- provide a canonical category/code
- provide a host-displayable message
- indicate whether the failure is retryable when that can be determined safely
- include safe metadata useful for support/debugging without leaking secrets or tokens
- never trigger hidden fallback generation
- distinguish non-retryable validation/auth/policy failures from plausibly transient failures such as interrupted streams or safe upstream transport failures

## Proposed implementation phases

### Phase 1: Define the canonical error shape

- [x] Introduce shared invocation error types and categories.
- [x] Separate UI-safe fields from lower-level debug metadata.
- [x] Ensure the contract is usable from both headless and React-hosted apps.

### Phase 2: Normalize hosted gateway errors

- [x] Map gateway auth and `/ai` failures into the canonical error contract.
- [x] Distinguish policy rejections, auth failures, request validation failures, and transport failures.
- [x] Preserve the hard-rejection posture documented by `@evergraytech/ai-gateway`.
- [x] Incorporate gateway retry guidance so expired-token flows refresh through `/auth`, while validation/policy/unsupported-model failures remain non-retryable.

### Phase 3: Normalize direct-provider errors

- [x] Map direct-provider execution failures into the same error contract.
- [x] Preserve a consistent no-fallback posture when direct execution fails.
- [x] Document which errors are likely retryable versus user-action-required.

### Phase 4: Document host failure handling

- [x] Add guidance showing how host apps surface structured errors directly.
- [x] Document that host apps should not rebuild provider-specific normalization layers on top.
- [x] Clarify how structured invocation errors interact with existing validation state and config UI.
- [x] Document how structured errors should represent interrupted or buffered streaming failures if streaming is enabled in a later phase.

## Acceptance criteria

This plan is complete when:

- [x] failed invocations return a canonical structured error shape
- [x] hosted and direct execution failures normalize into that shared shape
- [x] the contract is safe for host UI presentation and logging
- [x] the package never silently falls back to fake/local generation when invocation fails
