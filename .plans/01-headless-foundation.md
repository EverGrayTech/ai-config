# Plan: Headless Foundation

## Objective
Establish the typed, local-first headless foundation for `@evergraytech/ai-config` so EverGray Tech apps can define AI configuration behavior, merge app defaults with user state, and persist settings safely without depending on any UI layer.

## Customer Value
- Gives consuming apps a reusable AI configuration core before UI work begins
- Reduces repeated local-state and storage logic across EverGray Tech products
- Creates a stable foundation for provider/model extensibility and future React integration

## Scope Decisions (Locked)
- This plan produces headless configuration primitives, not a finished settings interface
- The foundation must remain usable without React imports
- Default persistence targets browser `localStorage`, but storage access must be adapter-based and SSR-safe
- State merge and normalization behavior must be explicit and deterministic
- Secret handling helpers are included here because they are foundational to safe storage/debug behavior

## Prerequisites
- `docs/system-spec.md`
- `README.md`

## Implementation Checklist

### 1. Public Core Types
- [x] Define canonical configuration, credential, generation, validation, usage-presentation, and app-definition types
- [x] Define schema-versioned persisted payload types and any normalization-related helper types
- [x] Separate public types from internal helper types so exports remain intentional

### 2. Default State and Merge Logic
- [x] Implement package-default state creation for the headless layer
- [x] Implement host-app-definition merge behavior with documented precedence rules
- [x] Implement normalization logic that corrects invalid provider/model/mode combinations safely

### 3. Storage Abstraction
- [x] Define a storage adapter contract for load/save/clear operations
- [x] Implement a browser `localStorage` adapter with configurable key namespace
- [x] Ensure storage access is SSR-safe and fails gracefully when browser storage is unavailable

### 4. Persistence and Recovery
- [x] Implement versioned persistence helpers for load/save/clear workflows
- [x] Handle corrupted or invalid stored payloads without crashing consuming apps
- [x] Establish basic schema-migration posture for future state evolution

### 5. Headless Manager and Utilities
- [x] Implement state transition helpers for mode, provider, model, credential, and generation updates
- [x] Provide a headless manager or equivalent subscription-friendly API for reading/updating/persisting state
- [x] Add redaction and debug-sanitization helpers that never expose raw secrets

## Acceptance Criteria
- [x] A consuming app can create and normalize AI config state without any React dependency
- [x] Package defaults, app defaults, and persisted user state merge in a deterministic order
- [x] Local persistence works behind an adapter and recovers safely from unavailable/corrupt storage
- [x] Core update actions exist for the primary state transitions required by the package
- [x] Debug and helper utilities avoid exposing raw credentials
