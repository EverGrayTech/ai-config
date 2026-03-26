# Plan 10: Unified invocation API

## Goal

Expand `@evergraytech/ai-config` from configuration/state ownership into a thin shared invocation coordinator that lets host apps submit AI work through one package-owned API.

The desired outcome is that a host app can ask the currently configured AI to perform work without manually resolving provider, model, mode, credential, hosted token, or transport details.

## Why this exists

Plot Your Path wants the package to own invocation routing as well as configuration so the app does not need to:

- duplicate provider-specific call logic
- manually inspect current config state to choose a provider/model
- implement a fake or local fallback generation layer
- maintain separate orchestration code for hosted mode versus BYOK mode

## Deployment and hosting constraints

- The package remains client-first and local-first in its core posture.
- Default hosted execution depends on the external `@evergraytech/ai-gateway` service contract.
- Direct BYOK execution remains browser/client executed unless a host explicitly injects a mediated transport path.
- This plan must not assume server-only runtime capabilities inside the package itself.

## Architectural update

The current docs describe `@evergraytech/ai-config` as configuration and settings management rather than the full inference runtime.

This plan does not turn the package into a full orchestration framework. Instead, it introduces a **thin invocation coordinator** that:

- resolves current AI configuration
- selects the correct execution backend
- normalizes request entry and response exit shapes

The package should still remain out of scope for:

- chat/session history management
- prompt workflow orchestration
- agent frameworks
- tool calling frameworks
- retrieval pipelines
- broad SDK abstraction beyond the supported invocation surface

## Required execution backends

The unified invocation API must support two execution paths behind one package-owned interface.

### Hosted/default mode

When the current config resolves to app-provided/default mode:

- invocation should route through `@evergraytech/ai-gateway`
- hosted execution should follow the gateway’s `/auth` then `/ai` flow
- the integration contract should account for `appId` and stable `clientId`
- the plan should define where token acquisition, token caching, expiry handling, and refresh responsibility live
- hosted invocation should support the gateway’s bounded zero-setup default behavior where provider and model may be omitted and gateway defaults are applied
- hosted invocation should preserve the distinction between an explicit hosted provider/model request and the gateway-managed default hosted path
- hosted invocation should account for the gateway’s normalized `/ai` request shape, including `input` and optional `stream`
- the package should not pretend it can execute hosted mode without a gateway integration boundary

### BYOK/direct mode

When the current config resolves to BYOK mode:

- invocation should route directly to the selected provider
- the package should use the selected provider, selected model, and stored credential from current config state
- host apps should not have to manually reconstruct those inputs before invoking

## Scope

### In scope

- a single app-facing invocation entrypoint and/or manager method
- resolution of active mode, provider, model, and credential from current config state
- execution-path branching between hosted/default mode and BYOK/direct mode
- explicit hosted integration boundary for gateway-backed execution
- explicit provider integration boundary for direct execution
- documentation of what host apps must supply for hosted execution

### Out of scope for this plan

- streaming support unless separately added in a later plan
- retries/backoff policy
- conversation state or session memory
- multi-step workflows
- prompt templating systems
- batching
- tool calling
- provider feature parity across every advanced option

## Proposed implementation phases

### Phase 1: Define invocation entrypoint and request boundary

- [x] Introduce a canonical invocation request shape for host apps.
- [x] Define the app-facing invocation API surface on the headless layer.
- [x] Keep the initial request payload intentionally narrow and well-scoped.
- [x] Document how invocation reads the currently resolved config rather than requiring host-managed provider/model resolution.
- [x] Decide how the package maps its request shape onto the gateway’s normalized `input` plus optional `stream` contract for hosted execution.

### Phase 2: Define execution backend boundaries

- [x] Introduce a hosted execution adapter boundary aligned with `@evergraytech/ai-gateway`.
- [x] Introduce a direct-provider execution adapter boundary for BYOK mode.
- [x] Define how the package chooses the backend based on current config state.
- [x] Ensure unsupported or unconfigured backends fail clearly rather than silently falling back.
- [x] Define how the hosted adapter handles omitted provider/model values so the gateway can apply its configured hosted defaults.
- [x] Define how gateway token expiration and retry-after-refresh behavior are handled without pushing token orchestration back into host apps.

### Phase 3: Define manager and host integration posture

- [x] Decide whether invocation should be exposed as a standalone function, manager method, or both.
- [x] Document how React and headless consumers call the shared invocation surface.
- [x] Ensure host apps can supply any required hosted gateway dependencies without re-owning orchestration logic.

### Phase 4: Update documentation and scope language

- [x] Update package docs/spec language to reflect the thin invocation coordinator role.
- [x] Explicitly distinguish “unified invocation layer” from “full AI runtime/orchestration framework.”
- [x] Add downstream guidance for hosted mode versus BYOK mode behavior.
- [x] Document that hosted default behavior is the bounded default use of the existing gateway path rather than a separate hosted-mode API surface.

## Acceptance criteria

This plan is complete when:

- [x] a host app can call one package-owned invocation API without manually resolving provider/model/credential details
- [x] the package routes hosted/default mode through the gateway integration boundary
- [x] the package routes BYOK mode through the direct-provider integration boundary
- [x] the package does not introduce fake/local fallback generation
- [x] the package documentation clearly explains the new runtime boundary and remaining non-goals
