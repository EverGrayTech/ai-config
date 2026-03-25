# Plan: Establish Styling Contract and Base Stylesheet

## Objective
Create the initial public styling surface for `@evergraytech/ai-config` so the package exposes a stable, documented, single-stylesheet contract that is neutral, usable, and easy for both EverGray Tech apps and third-party apps to override.

## Customer Value
- Gives the package a consistent default visual baseline instead of relying on unstyled browser controls
- Establishes stable styling hooks that consuming apps can safely target and override
- Creates the foundation needed for later optional EverGray Tech design-system-aware styling

## Scope Decisions (Locked)
- This phase establishes the styling contract and neutral base stylesheet only
- It must not introduce a dependency on `@evergraytech/design-system`
- It must not attempt to visually match EverGray Tech through copied tokens or hardcoded brand values
- The public stylesheet import model remains a single `styles/base.css` entry point
- Existing styling hooks, DOM expectations, and component usability must be preserved
- Styling must remain scoped to ai-config components and must not leak to global elements

## External Reference
- `C:\Users\RoseA\Repos\design-system\docs\consumption-guide.md`

## Prerequisites
- `docs/system-spec.md`
- `.plans/03-react-integration-and-settings-ui.md`
- `.plans/04-polish-testing-and-release-readiness.md`
- `.plans/06-design-system-aware-variable-bridging.md` should build on this plan, not replace it

## Implementation Checklist

### 1. Audit Current Styling Surface
- [x] Confirm the repo’s current styling gap: missing base stylesheet, missing public style entrypoint, and missing stable styling hooks where applicable
- [x] Inventory all rendered component sections, controls, and states that need stable selectors and default styling
- [x] Confirm the current stylesheet import path and packaging/export model for styles

### 2. Establish Styling Contract
- [x] Add stable class names and/or `data-*` hooks to the React components without changing their functional behavior
- [x] Define a documented slot/selector structure for panel, sections, labels, fields, help text, status states, and actions
- [x] Ensure the contract is suitable for host-app overrides and future design-system-aware bridging

- [x] Create `styles/base.css` as the package’s single public stylesheet entrypoint
- [x] Implement neutral, functional default styling for layout, typography posture, spacing, panel structure, controls, buttons, validation messaging, usage hints, and reset actions
- [x] Preserve layout integrity, control usability, visible focus, readable disabled states, and distinguishable error states without relying on any external design system
- [x] Ensure all selectors remain scoped to `ai-config` components with no global element styling leakage

### 3. Preserve Styling Contract and Compatibility
- [x] Keep class names, `data-*` attributes, and slot/DOM structure stable once introduced
- [x] Avoid breaking selector expectations for host-app overrides
- [x] Continue exposing styling through the existing single stylesheet import path only

### 4. Validation and Documentation
- [x] Validate the stylesheet in the default no-design-system case for usability, cohesion, and non-leaky scoping
- [x] Add or update docs to explain the stylesheet import, available styling hooks, and expected override posture for consuming apps
- [x] Confirm this phase introduces no design-system dependency and no copied EverGray Tech token values

## Acceptance Criteria
- [x] `@evergraytech/ai-config/styles/base.css` exists as a single public stylesheet entrypoint
- [x] Components render with a coherent, neutral, usable default appearance without `@evergraytech/design-system`
- [x] Stable styling hooks exist for host-app overrides and future design-system-aware bridging
- [x] Existing styling hooks and import expectations remain intact
- [x] Styles remain scoped to `ai-config` and preserve visible focus, distinguishable errors, and readable disabled states
