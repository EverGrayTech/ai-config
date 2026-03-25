# Plan: React Integration and Settings UI

## Objective
Add the optional React integration layer for `@evergraytech/ai-config` so EverGray Tech apps can consume state through hooks/context and render a lightly styled, accessible AI settings experience without rebuilding common controls from scratch.

## Customer Value
- Lets consuming React and Next.js apps integrate AI settings faster
- Provides a shared UX baseline while keeping styling authority in the host app
- Creates consistency across products for mode, provider, model, and credential-management interactions

## Scope Decisions (Locked)
- React support is additive; the headless/core layer remains the source of truth
- UI components should be lightly styled and easy to wrap or restyle in consuming apps
- The package should provide both lower-level components and a composed panel experience
- Accessibility is a first-class requirement, not a later polish item

## Prerequisites
- `docs/system-spec.md`
- `.plans/01-headless-foundation.md`
- `.plans/02-provider-registry-and-validation.md`

## Implementation Checklist

### 1. React State Integration
- [x] Implement React-facing state hooks for reading config state and dispatching updates
- [x] Provide a context/provider pattern if it meaningfully reduces integration burden
- [x] Ensure client-only behavior is isolated appropriately for storage-backed interactions

### 2. Core Settings Components
- [x] Implement mode, provider, model, API-key, generation-settings, usage-hint, credential-status, and reset components
- [x] Make components controlled or easy to use in controlled integration patterns
- [x] Ensure component APIs align with headless state/action concepts rather than duplicating logic

### 3. Composed Panel Experience
- [x] Implement an `AIConfigPanel` composition for common settings-screen use cases
- [x] Ensure the panel can show app-provided mode, BYOK posture, validation state, and usage/cost hints coherently
- [x] Keep composition flexible enough for consuming apps to hide or replace sections

### 4. Accessibility and Theming Posture
- [x] Provide proper labels, descriptions, validation messaging, and keyboard support across components
- [x] Keep styling restrained and non-invasive so host apps can match their existing system
- [x] Ensure the UI remains workable in dark-theme and low-assumption design-system environments

### 5. React Export Surface
- [x] Separate React exports from headless exports cleanly
- [x] Ensure safe import posture for SSR/build contexts in Next.js-style apps
- [x] Document expected usage patterns for hooks, provider, and components

## Acceptance Criteria
- [x] A React app can consume AI config state through package hooks or provider-based integration
- [x] The package exposes the minimum targeted settings components and a composed settings panel
- [x] Components are accessible, lightly styled, and practical to theme in consuming apps
- [x] React exports remain clearly separated from the headless/core API
- [x] Common settings flows work without forcing apps into a rigid UI structure
