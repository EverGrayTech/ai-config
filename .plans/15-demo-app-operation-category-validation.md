# Plan 15: Demo app validation for operation-category routing

## Goal

Extend `examples/demo-app` so it provides a real validation harness for the operation-category routing work completed in Plans 13 and 14.

The demo should make it easy to verify both the configuration UI behavior and the invocation-routing behavior against the deployed `ai-gateway` service.

## Why this exists

Plans 13 and 14 added meaningful behavior that is easiest to trust when it can be exercised live:

- default-only route behavior
- categorized route override behavior
- inheritance from Default when a category override is disabled
- visible mapping between `ai-config` state and the payload sent to the hosted gateway boundary
- visible gateway responses that confirm the selected route/model/provider are actually being used

The local demo app is the right place to provide that end-to-end validation surface.

## Scope

### In scope

- add a dedicated demo validation screen for route-aware invocation behavior
- demonstrate both a default-only app definition and a categorized app definition
- call the actual deployed `ai-gateway` service through a hosted-gateway adapter
- show structured logs for ai-config request resolution, gateway auth/invoke activity, and final results
- make it easy to test prompts such as "what model are you?"
- document any demo-specific configuration needed to run the validation flow

### Out of scope

- changing package routing semantics already established by Plans 13 and 14
- moving gateway URL ownership into reusable package internals unless required by existing architecture
- adding a fake backend when the purpose of the demo is validating the real hosted path

## Proposed implementation

### Phase 1: Demo information architecture

- [x] Add a new demo screen focused on route validation.
- [x] Keep the existing overview, gallery, and state-scenario screens intact.
- [x] Make the new screen clearly present both a default-only example and a categorized example.

### Phase 2: Hosted gateway integration in the demo

- [x] Create a demo-owned hosted gateway adapter that calls the deployed `ai-gateway`.
- [x] Keep the concrete gateway URL/client configuration in the demo app rather than hard-coding it into package internals.
- [x] Allow practical static-hosting usage via demo-owned configuration with sensible local fallback behavior if appropriate.

### Phase 3: Validation and observability UX

- [x] Show the current resolved ai-config state in the demo.
- [x] Show the invoke input and effective category used for each request.
- [x] Log the auth request, invoke request, response, and error states from the gateway adapter.
- [x] Show final normalized `manager.invoke(...)` results in the UI.
- [x] Provide controls for no-category invocation plus category-specific invocation such as `evaluate` and `write`.
- [x] Use a prompt like "what model are you?" as the default validation prompt.

### Phase 4: Demo documentation and validation

- [x] Update demo/development guidance if new configuration or validation steps are introduced.
- [x] Verify the demo builds and runs successfully.
- [x] Validate that changing route settings changes the visible invocation behavior and output.

## Acceptance criteria

This plan is complete when:

- [x] the demo includes a clear example of a default-only app definition
- [x] the demo includes a clear example of a categorized app definition
- [x] the demo visibly shows what ai-config resolves and what the hosted gateway receives
- [x] the demo uses the real deployed `ai-gateway` service rather than a fake server
- [x] a reviewer can easily confirm route inheritance vs category override behavior from the UI and logs
- [x] demo-specific setup and validation steps are documented well enough to repeat reliably
