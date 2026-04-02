# Plan 19: Unified ai-gateway routing for hosted and BYOK execution

## Goal

Route all invocation traffic through `ai-gateway`, including BYOK provider execution, so `@evergraytech/ai-config` remains focused on configuration, routing, and UI rather than implementing provider-specific networking clients.

## Why this exists

The current package exposes a BYOK execution branch that assumes host-supplied direct provider clients, but those clients are not implemented for OpenAI, Anthropic, Gemini, or OpenRouter. This leaves provider options visible in the UI without a coherent execution path and creates avoidable maintenance burden inside the package.

Unifying all execution through `ai-gateway` gives the product one transport boundary, one error-normalization layer, and one place to handle provider-specific request shaping.

The updated `ai-gateway` contract now gives this plan a concrete target: `/ai` accepts exactly two valid request shapes and distinguishes hosted versus BYOK by request shape alone, not by a separate mode flag.

## Deployment/hosting constraints

- The package remains a client-rendered React/TypeScript library with browser-local persistence.
- The demo app remains a Vite-based downstream validation harness.
- The package must continue to work in static-hosted environments by calling externally deployed gateway infrastructure rather than requiring repo-local backend runtime.
- This plan changes a documented architecture assumption, so docs/spec updates are part of the implementation.

## Scope

### In scope

- update the package invocation model so hosted/default and BYOK both execute through `ai-gateway`
- revise request/response types so gateway-bound invocation can represent BYOK provider, model, and user credential forwarding
- align package-side provider naming on `gemini` for gateway-facing behavior
- use raw BYOK credential forwarding per request via headers, with no remote persistence in this phase
- remove the current runtime dependency on `directProviders` for successful BYOK invocation
- update the demo validation harness to reflect the unified gateway execution story
- update package documentation to describe gateway-mediated BYOK behavior clearly
- preserve local credential storage in the browser for the panel/package state model

### Out of scope

- implementing secure remote credential vault behavior
- changing the local-first settings posture of the package
- defining the full server-side ai-gateway implementation in this repository
- adding provider SDKs or direct browser-side provider clients to `ai-config`

## Proposed implementation

### Phase 1: Invocation contract alignment

- [x] Expand gateway invocation types so BYOK requests can include provider/model selection and user-supplied credential material.
- [x] Remove the transitional `mode` concept from gateway-facing package requests.
- [x] Update the manager invoke path so it emits only the two valid `ai-gateway` request shapes:
  - hosted/default: omit provider, model, and credential
  - explicit BYOK: provide provider, model, and credential together
- [x] Normalize provider identity on `gemini` for gateway-facing contracts.
- [x] Preserve structured error behavior while replacing `byok-not-configured` direct-client failures with gateway-oriented failures.

### Phase 2: Demo and validation flow updates

- [x] Update the demo route-validation harness to reflect the finalized two-shape gateway contract.
- [x] Ensure OpenAI, Anthropic, Gemini, and OpenRouter remain selectable in the panel without implying unsupported direct execution.
- [x] Keep the request/result diagnostics understandable for downstream adopters validating the package, with hosted vs BYOK inferred by request shape alone.

### Phase 3: Documentation and public posture updates

- [x] Update `docs/system-spec.md` to describe unified gateway execution as the primary invocation architecture.
- [x] Update `docs/consumption-guide.md` examples and prose to remove direct-provider registry guidance from the main integration story and reflect the finalized two-shape gateway contract.
- [x] Update development guidance where validation expectations changed.

### Phase 4: Verification

- [x] Run package build and test validation after the type and manager changes.
- [x] Confirm the demo still reflects the intended downstream-adoption story.
- [x] Clearly call out any remaining required `ai-gateway` changes needed before BYOK execution works end to end.

## Credential handling decision

- BYOK credentials are sent to `ai-gateway` as raw per-request credential material.
- This phase uses header-based forwarding rather than request-body persistence.
- `ai-config` continues to store the user key locally in browser state/local storage only; it does not introduce remote credential persistence.

## Final gateway contract alignment

- `ai-gateway` is now the source of truth for the request contract.
- `ai-config` should not send a gateway `mode` field.
- Valid hosted/default requests include none of: `provider`, `model`, `X-EG-AI-Provider-Credential`.
- Valid explicit BYOK requests include all of: `provider`, `model`, `X-EG-AI-Provider-Credential`.
- Mixed or partial combinations are invalid and should be rejected rather than inferred.
- Gateway-facing provider naming should normalize on `gemini` rather than `google`.

## Acceptance criteria

This plan is complete when:

- [x] `@evergraytech/ai-config` no longer requires direct provider clients for BYOK invocation
- [x] all invocation traffic is modeled as gateway-mediated in the package runtime and docs
- [x] OpenRouter no longer fails with `byok-not-configured` purely due to missing in-package direct client support
- [x] the demo communicates a coherent execution model for both hosted/default and BYOK flows
- [x] remaining `ai-gateway` follow-up requirements are explicitly documented
