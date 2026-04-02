# Plan 17: ai-gateway and wrapper validation via demo app

## Goal

Validate both the hosted `@evergraytech/ai-gateway` service contract and the way `@evergraytech/ai-config` wraps and normalizes calls to it, while also pushing the package toward a dead-simple integration posture where host apps primarily:

- set environment/config values
- import the package provider/panel surface
- optionally declare operation categories
- render the panel
- call package-owned `invoke()` with prompt and optional category

The local demo app should act as a validation harness for that package-owned experience rather than as a parallel implementation with app-only wiring logic.

## Why this exists

The package now owns a thin hosted invocation surface, but application teams need confidence in two separate layers:

- the deployed gateway itself must behave according to the documented `/auth` then `/ai` contract
- the package wrapper must route hosted requests correctly, normalize success metadata, and surface structured errors clearly enough for direct app handling

The current demo app already logs hosted auth and invoke traffic, but too much demo-owned wiring risks validating a toy composition rather than the actual package surface that downstream apps will consume.

This plan therefore covers both hosted validation and responsibility realignment so the demo stays close to a real integration target.

## Deployment/hosting constraints

- `@evergraytech/ai-config` remains a client-first, local-first TypeScript/React package.
- The demo app remains a Vite client-rendered harness and must stay compatible with static-hosting-friendly usage.
- Hosted validation must continue to use the deployed `ai-gateway` service rather than introducing a repo-local backend dependency.
- Demo-specific hosted configuration must remain isolated to `examples/demo-app` and must not become part of the published package API surface or a required shared app-package default.

## Scope

### In scope

- capture the service-vs-wrapper validation goal in repo plan tracking
- inspect the package invocation layer against the documented gateway contract
- update the demo so hosted validation defaults to the live gateway base URL
- document demo-only environment configuration for hosted validation, especially client ID handling
- improve the demo validation posture so investigators can distinguish service-contract failures from package-normalization failures without adding non-app-realistic panel behavior
- audit and reduce demo-owned wiring that should instead live in package-owned surfaces
- refine the package direction toward a host experience that does not require apps to manually wire hosted execution details
- implement any small package or demo fixes needed to make both validation layers testable and understandable

### Out of scope

- redesigning the hosted gateway contract itself
- adding server-only infrastructure to this repo
- baking a real production client ID into the published package
- expanding the package into a full chat runtime or orchestration layer

## Proposed implementation

### Phase 1: Investigation and contract alignment

- [x] Inspect `ai-config` hosted invocation behavior against the documented `ai-gateway` `/auth` and `/ai` flow.
- [x] Confirm whether the demo’s handwritten gateway client matches the package’s hosted expectations and current gateway payload contract.
- [x] Identify any mismatch in provider/model defaults, error assumptions, or retry semantics that could blur service-vs-wrapper validation.

### Phase 2: Demo-hosted validation posture

- [x] Replace the demo’s invalid fallback gateway URL with the live hosted base URL `https://ai.evergraytech.com/`.
- [x] Keep client identity demo-scoped by documenting and wiring a demo-only `VITE_AI_GATEWAY_CLIENT_ID` setup path.
- [x] Remove non-app-realistic setup/debug text from the route-validation panels.

### Phase 3: Wrapper and service validation fixes

- [x] Implement any minimal package or demo fixes needed so the demo can validate both raw gateway behavior and `manager.invoke()` behavior cleanly.
- [x] Preserve structured package error behavior for configuration, authentication, network, and provider failures.
- [x] Preserve original hosted gateway error details inside package-normalized failures when upstream structured errors are available.
- [x] Improve hosted invoke classification so policy-style gateway rejections are not flattened into generic network failures.
- [x] Align hosted default-mode behavior with the gateway contract by omitting model/provider unless an explicit hosted override is selected.

### Phase 4: Responsibility-boundary realignment

- [x] Audit the route-validation screen for wiring that real apps should not have to own.
- [x] Identify package-owned convenience surfaces needed to avoid manual hosted gateway wiring in host apps.
- [ ] Rework the demo toward importing those package-owned seams instead of recreating integration behavior locally.

### Phase 5: Validation and documentation

- [x] Run relevant quality checks for package and demo changes.
- [ ] Update maintainer-facing docs where the demo hosted-validation setup changed and where the integration posture is being simplified.
- [x] Mark completed investigation/fix status in this plan.

## Acceptance criteria

This plan is complete when:

- [x] the demo can target the live hosted gateway by default without additional base-URL setup
- [x] demo-only client ID setup is documented without leaking into the public package surface
- [x] investigators can clearly validate the hosted gateway contract separately from package-wrapper behavior
- [x] package-hosted invocation behavior remains aligned with the documented `ai-gateway` contract
- [x] any discovered wrapper/demo issues needed for seamless validation are fixed
- [ ] the demo no longer adds non-app-realistic panel behavior for hosted setup/debug state
- [ ] the package direction clearly favors panel/import/invoke usage over host-managed wiring

## Recommended next package-surface simplifications

- add a package-owned hosted gateway client/adapter factory so apps do not hand-roll `/auth` and `/ai` fetch logic
- add a higher-level React/provider convenience that can resolve hosted gateway configuration from env/config inputs rather than requiring host-side `createAIConfigManager({ hostedGateway })` wiring
- expose an ergonomic package-owned invoke hook or helper for React consumers so apps can call `invoke()` without directly reaching into custom manager setup
- rework the demo route-validation screen to consume those exported conveniences and keep only prompt/result/log observation as demo-specific behavior

## Notes

- `ai-config` hosted invocation is aligned with the documented `ai-gateway` contract: it authenticates with `{ appId, clientId }`, then invokes `/ai` with bearer token plus normalized `{ provider?, model?, input, stream }` payload.
- Hosted failures now preserve upstream gateway context when available via `result.upstream`, allowing package-level normalization without losing the original gateway code/message/category/status/details.
- Live-gateway validation clarified that generic hosted default mode should omit `model` and let the gateway resolve the hosted default route; explicit hosted overrides still pass a selected model when intentionally configured.
- The current demo still contains handwritten gateway adapter and manager wiring, which is acceptable as an investigation harness but is now explicitly being treated as a responsibility-boundary smell to reduce in follow-on work.
- Quality checks completed successfully after the hosted error-preservation/model-alignment changes: `pnpm typecheck`, `pnpm test`, `pnpm demo:build`, and `pnpm build`.
