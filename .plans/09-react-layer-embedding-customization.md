# Plan 09: React-layer embedding and customization for host Settings pages

## Goal

Make the packaged React layer safe and predictable for downstream apps that embed AI configuration inside an existing Settings page rather than rendering it as a standalone full-page experience.

This plan covers the host-app integration contract for `@evergraytech/ai-config/react`, especially around layout ownership, styling boundaries, client-only behavior, and state access outside the packaged panel.

## Current context

- The package already exposes a composed `AIConfigPanel` plus lower-level React hooks and components.
- The current React layer is client-rendered and local-storage-backed.
- The current stylesheet applies visible panel framing directly on the top-level panel container.
- Host apps may already use EverGray design-system layouts, cards, headings, trust-model copy, and surrounding settings sections.

## Deployment and hosting constraints

- The package is browser/client-first.
- Persisted AI configuration is localStorage-based.
- The React provider and packaged panel must be treated as client-rendered UI in frameworks that support server components.
- Host apps must not assume persisted AI config is fully available during server render or static generation.
- Any documentation or API changes in this plan must remain compatible with static-export-friendly consumption, meaning no new server-only integration requirement should be introduced.

## Problem statement

The first downstream app wants to place the AI configuration UI inside its existing Settings page. That requires a clearer embedding contract than the package currently documents.

Today, the composed panel renders successfully as a self-contained block, but the integration story is incomplete in the following areas:

- whether the panel is intended to own its own card/frame
- how host apps should compose adjacent copy and neighboring settings sections
- how client-only and hydration behavior should be explained to hosts
- which styling hooks are stable for overrides
- how host components should read current config state without bypassing package ownership

## Scope

### Blocking requirements

1. Document page-embedding support for `AIConfigPanel` inside an existing Settings page section.
2. Define how host apps can compose headings, explanatory copy, and adjacent settings blocks around the panel without layout conflicts.
3. Clarify client-component, hydration, and static-export posture for React consumers.
4. Define the styling contract clearly, including required CSS import, stable override hooks, and framing/spacing expectations inside host layouts.
5. Document the supported React-layer state access pattern for host components outside the panel.

### Nice-to-have follow-ups

- change callbacks or events for meaningful config updates
- a compact summary or status component in addition to the full panel
- optional slots or props for app-specific copy blocks

## Proposed implementation phases

### Phase 1: Clarify and document the current React integration contract

- [x] Update downstream-facing docs to explain that the React layer is client-only in practice.
- [x] Document the required stylesheet import and the intended public React entrypoints.
- [x] Add explicit guidance for Next.js-style server-component hosts on where the provider and panel should live.
- [x] Document that persisted local state loads on the client and may not be available during server render.
- [x] Document the currently supported state-reading hooks for host-owned copy, labels, and downstream actions.

### Phase 2: Define embedding-safe layout ownership

- [x] Decide whether `AIConfigPanel` should remain framed by default, become neutral by default, or support an explicit framing variant.
- [x] Ensure the package can be rendered inside an existing host card or section without duplicated borders, padding, or layout assumptions.
- [x] Preserve a simple out-of-the-box experience while making host-page embedding predictable.
- [x] Document the intended relationship between the composed panel and lower-level building-block components.

### Phase 3: Tighten the styling contract

- [x] Confirm which class names and data attributes are stable host-facing hooks.
- [x] Distinguish supported host overrides from internal styling details that may change.
- [x] Document the CSS-variable override posture, including compatibility with EverGray design-system tokens.
- [x] Clarify whether the top-level panel is safe to place inside existing app card, section, or stack layouts.

### Phase 4: Evaluate lightweight React-layer extension points

- [x] Assess whether host apps need first-class change notifications beyond reading context state.
- [ ] Assess whether a compact summary/status surface should be exported as a supported component.
- [x] Assess whether app-owned copy should be handled by normal composition outside the panel or by optional slots/props.
- [x] Keep any new API additions minimal and aligned with the package’s restrained UI posture.

## Expected design direction

The implementation should favor a restrained composition model:

- [x] `AIConfigPanel` should work as a section-level building block inside a larger Settings page.
- [x] Host apps should remain free to place their own headings, explanatory text, trust-model language, and neighboring settings sections before or after the panel.
- [x] Host components should read current config via exported context hooks rather than reaching into internal manager implementation details.
- [x] Styling should remain lightly branded and override-friendly, especially for hosts already using EverGray design-system primitives.

## Acceptance criteria

This plan is complete when the package and its documentation make the following true for downstream React consumers:

- [x] A host app can embed AI config in an existing Settings page without the package assuming full-page ownership.
- [x] A host app can compose surrounding app-specific content around the packaged UI without layout breakage.
- [x] The docs clearly state the client-only integration rule and localStorage/hydration implications.
- [x] The docs clearly state the required CSS import and the stable styling hooks intended for host overrides.
- [x] The package documents how host components can read selected mode, provider, model, and other current config state outside the panel.
- [x] Any framing, spacing, or layout ownership assumptions are either removed, made optional, or documented explicitly.

## Out-of-scope cautions

- Do not expand this work into a full server-synced settings architecture.
- Do not introduce backend-only requirements for validation, persistence, or rendering.
- Do not turn the React layer into a rigid design-system wrapper that prevents host composition.
- Do not add broad eventing or slot APIs unless the simpler documented composition model is insufficient.
