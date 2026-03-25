# System Specification: `@evergraytech/ai-config`

## Purpose

`@evergraytech/ai-config` is a shared TypeScript package for EverGray Tech applications that need configurable AI behavior with a client-first, local-first operating model.

The package exists to standardize how EverGray Tech products:

- expose a zero-setup default AI path when the host app can subsidize or provide one
- support optional bring-your-own-key provider workflows
- persist AI configuration locally in the browser
- present provider, model, and generation settings consistently across products
- separate reusable configuration concerns from app-specific domain logic

This package is a configuration and settings-management layer. It is not the complete inference runtime, agent framework, prompt orchestration system, or analytics platform.

## Product Posture

### Primary goals

- reduce startup friction for non-technical users
- preserve a no-setup path when a host app can provide a default AI mode
- support power-user bring-your-own-key workflows without backend dependency
- keep user-controlled AI settings local-first
- make provider and model selection behavior consistent across EverGray Tech apps
- provide a polished, developer-friendly integration surface for TypeScript and React applications

### Non-goals for v0

The package must not expand into:

- server-side credential storage
- user accounts or identity management
- billing infrastructure
- exact token accounting across providers
- provider-specific feature parity for every advanced capability
- prompt orchestration or conversation management
- agent frameworks or RAG systems
- analytics backends or dashboards
- hosted key vault behavior
- synchronized settings across devices

## Architectural Principles

- **client-first**: the package must work without requiring a backend service
- **local-first**: user-managed settings persist locally by default
- **typed by default**: core state and integration contracts must be explicit and stable
- **framework-friendly**: headless logic should remain usable independently from the React layer
- **minimal assumptions**: host apps can define policies, messaging, and available options without fighting the package
- **graceful recovery**: invalid persisted state, missing providers, and stale models must fail safely
- **restrained UI posture**: optional UI components should be accessible and helpful without imposing a visual system on consuming apps

## Capability Boundaries

### In scope

The package should provide:

1. a canonical typed configuration model
2. deterministic merge behavior between package defaults, app defaults, and persisted user state
3. local persistence abstractions and browser-safe storage behavior
4. provider and model registry abstractions
5. credential-management helpers and validation interfaces
6. state transition utilities and React-facing convenience APIs
7. rough usage and cost-awareness presentation support
8. optional React settings components that consuming apps can style or wrap

### Out of scope

The package must not become responsible for:

- executing every inference request end to end
- managing prompts, chats, or session history
- serving as a general AI SDK abstraction layer across all runtime concerns
- storing secrets remotely
- exact usage metering, invoice-grade pricing, or provider billing reconciliation
- non-React UI implementations in v0

## Package Model

The package should be publishable as a single package with two logical layers.

### Headless/core layer

The core layer owns:

- types
- default state creation
- merge and normalization behavior
- storage abstractions
- provider and model registry logic
- validation interfaces
- usage/cost presentation helpers
- sanitization and redaction utilities

This layer must remain usable without importing the React UI surface.

### React layer

The React layer owns:

- context/provider conveniences where useful
- state/action hooks for app integration
- lightly styled, accessible settings components
- composed settings-panel behavior built on lower-level reusable pieces

The React layer should depend on the headless layer, not redefine it.

### Suggested module posture

```txt
src/
  core/
    types/
    config/
    storage/
    providers/
    models/
    usage/
    validation/
    hooks/
  react/
    components/
    hooks/
    styles/
  index.ts
  react.ts
```

The final implementation may refine folder names, but the separation between headless and React exports should remain clear and stable.

## Core Domain Expectations

### Supported end-user flows

The package must support the following user experiences:

1. **Zero-setup default mode**
   - the host app can expose an app-provided default provider/model path
   - no user API key is required
   - the UI can clearly indicate that the user is in app-provided mode

2. **Bring your own key**
   - the user can choose a supported provider
   - the user can enter and manage a locally stored API key
   - the user can validate that key through pluggable provider or host-supplied behavior
   - the user can select from supported models for that provider
   - the user can switch back to default mode at any time

3. **Generation preferences**
   - the user can choose a model
   - the user can adjust temperature and output limits where applicable
   - host apps may expose an optional reasoning or quality preset
   - the user can reset generation settings to defaults

4. **Credential management**
   - the user can see whether a key exists for a provider
   - the user can replace or clear a key
   - the user can clear all AI settings
   - validation state and last-known validation result can be surfaced without exposing the secret itself

5. **Usage/cost awareness**
   - the package can distinguish app-provided mode from BYOK mode
   - the UI can surface rough cost or usage hints when metadata exists
   - host apps can provide free-tier guidance or usage-limit messaging

## Canonical State Model

The package should expose a stable, typed state model that can represent:

- active mode
- selected provider
- selected model
- stored credentials by provider
- generation settings
- validation state
- usage/cost presentation metadata
- host-app defaults and merged user state outcomes

The exact type definitions may evolve, but the public model should preserve clear semantics around those concepts.

### Required state behavior

- if mode is `default`, BYOK credentials may still exist but remain inactive
- if mode is `byok`, the selected provider must be enabled and valid for the host app
- the selected model must belong to the active provider or be corrected safely
- clearing one provider credential must not damage unrelated provider records
- switching providers should preserve stored credentials for other providers
- invalid persisted selections should be normalized without breaking the app

### Merge precedence

State resolution should be deterministic and documented with the following precedence:

1. package defaults
2. host app definition defaults
3. persisted user state

Normalization should occur after merge so invalid combinations are corrected gracefully.

## Host App Definition and Extensibility

Host applications must be able to control:

- whether default mode exists
- whether BYOK is enabled
- which providers are available
- which models are available
- provider ordering
- default labels and explanatory copy
- free-tier or subsidized-mode messaging
- default generation settings
- validation behavior

The package should favor app definitions and composable registries over hardcoded product assumptions.

### Extensibility expectations

- host apps can register or override provider definitions
- host apps can filter, alias, or curate model lists
- host apps can provide custom validation implementations
- host apps can replace the storage adapter
- host apps can consume only the headless API and build their own UI entirely

## Provider and Model Registry Expectations

The package should ship with a modest initial provider set suitable for v0, such as:

- OpenAI
- Anthropic
- Google
- OpenRouter

### Provider metadata expectations

Provider definitions should be suitable for UI and logic needs, including:

- stable provider id
- display label
- credential field labeling and input hinting
- BYOK support posture
- model list or model resolver behavior
- optional validation implementation
- optional help or docs text

### Model metadata expectations

Model descriptors should support metadata such as:

- label
- provider
- capability flags
- context and output limits where known
- rough cost hints
- active / preview / deprecated status
- host-defined disabled or curated posture

The system must not assume feature parity across providers.

## Persistence, Versioning, and Recovery

All user-managed configuration should persist locally in browser storage by default.

### Required behavior

- default persistence uses `localStorage`
- storage access is abstracted behind an adapter interface
- storage namespace/keying is configurable
- usage remains SSR-safe and must not fail in non-browser contexts
- stored payloads are versioned for future migration support
- corrupted or unreadable payloads fail safely and recover to a valid state

### Recovery posture

The package must recover gracefully when:

- local storage is unavailable
- persisted JSON is corrupted
- the saved schema version is outdated
- a previously selected provider is no longer enabled
- a previously selected model is no longer available

Recovery should prefer preserving unaffected settings while resetting invalid ones.

## Security Expectations

This package intentionally supports local browser/device storage of provider API keys. That tradeoff must be documented clearly and consistently.

### Security guardrails

- never describe local storage as equivalent to secure server-side secret storage
- avoid logging raw credentials
- provide helpers for redacted display and debug-safe sanitization
- ensure validation results and debug output do not leak secrets
- provide explicit APIs for clearing stored credentials and clearing all persisted AI state

### Optional posture for v0

Light obfuscation at rest may be used only as minor UX polish. It must not be presented as real security.

## Validation Architecture

Bring-your-own-key validation must be supported, but networking strategy should remain pluggable.

### Validation principles

- validation is optional and host-configurable
- provider definitions may include validation behavior
- host apps may override or replace provider validation
- validation results should expose status, message, and validation timestamp where available
- validation state may be stored, but raw secrets must not appear in validation outputs

The package should not force direct client-side networking if a host app prefers mediated validation behavior.

## Headless API Expectations

The package should expose a clean headless surface supporting at least:

- initial state creation
- merge with host app definition
- reading current state
- mode updates
- provider updates
- model updates
- credential set and clear operations
- generation-setting updates
- reset and recovery operations
- storage load/save/clear
- state observation/subscription patterns where appropriate
- debug-safe sanitization helpers

Pure state transition functions are preferred where practical, with React hooks layered on top as convenience APIs rather than the only integration path.

## React/UI Architecture

The React layer is optional and should remain easy to theme in consuming applications.

### UI posture

- components should be lightly styled and not impose a strong visual brand
- consuming apps should be able to wrap, restyle, or compose them freely
- the assembled settings panel should be a convenience composition, not the only viable UI posture
- components should work in dark-theme environments without assuming a design-system lock-in

### Minimum component targets

- `AIConfigPanel`
- `AIModeSelector`
- `AIProviderSelector`
- `AIModelSelector`
- `AIApiKeyField`
- `AIGenerationSettingsForm`
- `AIUsageHint`
- `AICredentialStatus`
- `AIConfigResetButton`

### Accessibility expectations

UI components must:

- provide proper labels and descriptions
- support keyboard navigation
- communicate errors accessibly
- avoid relying on color alone for meaning
- expose screen-reader-friendly explanations for privacy, validation, and usage/cost context

## Developer Experience Expectations

The package should feel straightforward to integrate into EverGray Tech’s TypeScript and React applications.

### DX requirements

- TypeScript-first public API
- strict typing and clear exported boundaries
- tree-shakeable exports where practical
- documentation for headless and React usage
- examples suitable for Next.js and client-oriented React apps
- safe import behavior for SSR/build contexts
- minimal unnecessary dependencies

The package should optimize for clarity and low integration burden over speculative abstraction.

## Testing and Quality Expectations

At minimum, the package should include automated coverage for:

### Core behavior

- config initialization
- mode, provider, and model switching
- credential set/clear behavior
- merge precedence and normalization
- storage load/save/clear
- corrupted storage recovery
- schema migration basics

### Validation behavior

- success, invalid, and error validation outcomes
- secret redaction and sanitization behavior

### React behavior

- panel rendering
- controlled state integration
- accessibility basics
- persistence-linked state updates

Testing should support the repo’s TypeScript testing standards and coverage expectations.

## Documentation Expectations

Repository documentation should cover:

1. package purpose
2. problem statement
3. local-first security caveat
4. installation and integration posture
5. headless usage examples
6. React usage examples
7. host app customization
8. provider/model registration
9. persistence behavior
10. validation behavior
11. migration/versioning notes
12. styling/theming guidance

## Initial Delivery Shape

The initial repository direction should produce:

1. a detailed implementation plan in `.plans/`
2. documented package structure and public API direction
3. core type definitions and storage abstractions
4. provider/model registry design
5. headless configuration/state utilities
6. React hooks and settings components
7. tests
8. README and system-level documentation

## Acceptance Posture for v0

The v0 package is acceptable when a host app can:

- install `@evergraytech/ai-config`
- define an app-provided default AI mode
- enable BYOK for selected providers
- render a settings UI or consume the headless layer directly
- persist user choices locally
- validate and manage provider keys
- switch cleanly between default and BYOK modes
- filter or curate model availability
- recover safely from missing or corrupt local state
- do all of the above without requiring a backend dependency

## Release Readiness Notes

For internal publication readiness, the package should maintain:

- separate `index` and `react` entry points
- passing `test`, `typecheck`, and `build` workflows
- stable exported contracts for headless and React consumers
- documentation that matches the actual public API and local-first caveats
- plan tracking in `.plans/` that records completed implementation phases
