# Plan: Local Demo App and Validation Harness

## Objective
Add a small in-repo demo application that renders `@evergraytech/ai-config` components in a way that makes manual validation fast today and scalable as the package gains additional UI components and states in the future.

## Customer Value
- Gives package maintainers a fast visual/manual validation loop beyond automated tests
- Makes it easy to inspect composed flows, individual components, and edge states without wiring a separate consuming app
- Creates a durable preview surface that can grow as the package exports additional UI pieces

## Scope Decisions (Locked)
- Prefer a lightweight local demo app over Storybook for the initial preview surface
- The demo app must live inside this repo but remain clearly separate from the publishable package
- The demo must validate both the composed panel and lower-level components/states
- The demo must remain useful as more components are added; structure matters more than a one-off example page
- Optional design-system validation must not add a package dependency from `@evergraytech/ai-config` to `@evergraytech/design-system`

## External References
- `.plans/05-optional-design-system-aware-styling.md`
- `.plans/06-design-system-aware-variable-bridging.md`
- `C:\Users\RoseA\Repos\design-system\docs\consumption-guide.md`

## Implementation Checklist

### 1. Establish Demo-App Architecture
- [ ] Add a lightweight React-based local demo app under a clearly non-publishable repo path such as `examples/demo-app/`
- [ ] Configure the demo so it can consume the local package source/build cleanly during development
- [ ] Ensure the app has a clear startup command and minimal maintenance burden

### 2. Create Durable Validation Surfaces
- [ ] Add an overview screen for the composed `AIConfigPanel` happy path
- [ ] Add a component gallery screen for validating individual exported React components in isolation or focused composition
- [ ] Add a state-scenarios screen for validating important configuration states (default mode, BYOK, saved key, validation states, usage states)
- [ ] Structure screens/components so future exports can be added without redesigning the demo app

### 3. Support Optional Design-System Validation
- [ ] Keep the default demo path working without `@evergraytech/design-system`
- [ ] Provide an optional validation mode that can load design-system CSS variables when available locally
- [ ] Ensure the demo’s optional design-system posture does not create runtime or package coupling for the main library

### 4. Developer Experience for the Demo
- [ ] Add a simple navigation/control pattern for switching between screens and validation scenarios
- [ ] Make it easy to verify neutral styling vs design-system-aware styling
- [ ] Keep the demo lightweight enough that it complements tests rather than replacing them

### 5. Validation and Repo Fit
- [ ] Validate that the demo app runs locally from this repo with documented commands
- [ ] Confirm the demo app is excluded from publishable package outputs where appropriate
- [ ] Ensure the demo reinforces current component contracts rather than introducing a second source of truth

## Acceptance Criteria
- [ ] A maintainer can run a local demo app directly from this repo
- [ ] The demo app includes a composed view, component-gallery view, and state-scenarios view
- [ ] The demo structure is easy to extend as more components are added
- [ ] Neutral validation works with only this repo
- [ ] Optional design-system-aware validation is possible without coupling the package itself to `@evergraytech/design-system`
