# Plan: Design-System-Aware Variable Bridging

## Objective
Build on the established `@evergraytech/ai-config` styling contract and base stylesheet so the package automatically aligns with `@evergraytech/design-system` when its CSS variables are already loaded by the host app, while remaining fully functional and neutral when they are not.

## Customer Value
- Lets EverGray Tech apps inherit a more native shared-product appearance with minimal integration work
- Preserves usability and flexibility for third-party apps that do not use the EverGray Tech design system
- Prevents token drift by bridging to shared CSS variables instead of duplicating design-system values locally

## Scope Decisions (Locked)
- No dependency may be added from `@evergraytech/ai-config` to `@evergraytech/design-system`
- No files may be imported directly from the design-system package
- Styling integration must rely on CSS variable bridging only
- Fallback values must remain neutral and functional rather than trying to recreate EverGray Tech branding locally
- The public stylesheet import model remains a single `styles/base.css` entry point

## External Reference
- `C:\Users\RoseA\Repos\design-system\docs\consumption-guide.md`

## Prerequisites
- `docs/system-spec.md`
- `.plans/05-optional-design-system-aware-styling.md`

## Implementation Checklist

### 1. Audit the Base Stylesheet for Bridge Opportunities
- [ ] Review all visual values in `styles/base.css` that should route through a token bridge
- [ ] Identify the minimal set of AI-scoped variables needed for panel, text, borders, controls, radius, focus, disabled, and error states
- [ ] Confirm the base styling contract remains stable while bridging is added

### 2. Introduce AI-Scoped Variable Layer
- [ ] Define a small set of AI-scoped variables that act as the package styling abstraction layer
- [ ] Map those variables to design-system CSS variables when present using `var(--design-system-token, fallback)`
- [ ] Keep fallback values neutral and safe rather than mirroring EverGray Tech token values locally

### 3. Refactor Base Stylesheet to Use Variable Bridging
- [ ] Replace direct visual values with AI-scoped variables or bridged references throughout the stylesheet
- [ ] Preserve usability, layout stability, visible focus states, distinguishable errors, and readable disabled states even without design-system variables
- [ ] Ensure no selectors leak globally and no unrelated app elements are styled

### 4. Validate Compatibility and Non-Goals
- [ ] Validate the stylesheet in two environments: with design-system variables loaded and without them
- [ ] Confirm no dependency, direct import, mirrored token definitions, or copied design-system values were introduced
- [ ] Confirm no breaking changes to public class names, `data-*` hooks, slot structure, or stylesheet import path

### 5. Documentation and Consumption Guidance
- [ ] Update docs to explain optional design-system-aware styling behavior
- [ ] Document the override surface for EverGray Tech apps and third-party consumers
- [ ] Clarify that design-system alignment happens automatically only when host apps already load the relevant CSS variables

## Acceptance Criteria
- [ ] With `@evergraytech/design-system` variables loaded by the host app, ai-config styling aligns with the shared EverGray Tech visual system without additional package coupling
- [ ] Without design-system variables, components remain neutral, legible, and fully usable
- [ ] The stylesheet uses CSS variable bridging throughout and does not duplicate design-system token values
- [ ] Public styling hooks and the single stylesheet import contract remain intact
- [ ] Accessibility-critical states remain visible and reliable in both environments
