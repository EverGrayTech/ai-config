# Plan 21: Categorized operations validation UX refinement

## Goal

Improve the `examples/demo-app` categorized operations validation experience so reviewers can quickly understand the relationship between the Default route, category-specific overrides, and invocation behavior without the current visual overload.

The updated screen should make categorized configuration feel like a set of clearly separated validation sections rather than one continuous form, while keeping the demo aligned with the package’s downstream-adoption purpose.

## Why this exists

The current categorized validation flow communicates the right underlying capabilities, but the UI makes the mental model harder to grasp than it should be:

- Default generation settings visually blend into the next category section
- Default can read like a sibling category rather than the baseline/fallback route
- category purpose is not obvious until the user scans deeper into each section
- enabled state for category overrides is not surfaced where users first orient themselves
- the invocation area contains more controls than are needed for practical validation

That makes the demo less effective as a downstream validation harness for categorized-operation support.

## Deployment/hosting constraints

- The work remains within the client-rendered Vite demo harness under `examples/demo-app`.
- The demo must stay compatible with the current hosted `ai-gateway` validation posture and existing environment-variable-based configuration.
- This plan should not introduce any new backend requirement, server runtime dependency, or non-static-hosting assumption.

## Scope

### In scope

- give Default and each named category its own clearly bounded section/card treatment
- use a hybrid hierarchy where Default receives the same general section treatment as categories, but stronger copy and subtle visual cues establish it as the fallback baseline
- move each category’s concise description into the section header row so the purpose is visible immediately
- place the category enabled control on the same header row as the category name/description
- add explicit Default copy describing fallback behavior and how categories override it when enabled
- simplify the invocation area to a category selector plus a single invoke action
- preserve the demo’s usefulness for validating override inheritance and category-aware invocation behavior

### Out of scope

- changing package routing semantics or category inheritance rules
- introducing demo-only behavior that consuming apps could not reasonably mirror through the public package surface
- redesigning the entire demo app navigation or unrelated validation screens
- expanding invocation controls beyond what is needed to validate selected-category execution

## Proposed implementation

### Phase 1: Section hierarchy and mental-model clarity

- [x] Rework the categorized validation layout so Default and each category render as distinct, visually separated sections.
- [x] Keep the overall treatment consistent across sections while giving Default subtle hierarchy cues that reinforce its baseline/fallback role.
- [x] Remove the current visual ambiguity that makes Default settings appear to continue into the next category.

### Phase 2: Header-row information architecture

- [x] Promote each section header into the primary orientation surface for that route/category.
- [x] Render category name and concise description on one line where practical, using copy such as “**Evaluate** — Used for validation and scoring tasks.”
- [x] Add equivalent one-line explanatory copy for Default that communicates fallback behavior and override posture.
- [x] Place each category enabled checkbox/toggle in the same header row so override state is visible before expanding into controls.

### Phase 3: Invocation simplification

- [x] Reduce the invocation controls to the minimum validation surface needed for categorized-operation testing.
- [x] Keep a category selector that clearly chooses which route to invoke.
- [x] Replace the current more complex invocation arrangement with a single invoke button that uses the selected option.
- [x] Preserve enough visible result/log context to confirm which route was exercised and whether Default or a category override handled the request.

### Phase 4: Validation fidelity and polish

- [x] Verify the simplified screen still makes inheritance vs enabled-override behavior understandable during review.
- [x] Ensure the revised structure helps reviewers reason about categorized configuration without needing to open every section.
- [x] Update any demo-facing explanatory copy only where needed to reflect the clearer fallback-versus-override mental model.

## Acceptance criteria

This plan is complete when:

- [x] the categorized validation UI no longer reads as one continuous undifferentiated form
- [x] Default has the same broad section treatment as categories but is clearly understood as the fallback baseline
- [x] each category exposes its name, short purpose description, and enabled state at the top of the section
- [x] the Default section clearly explains that it applies when no category-specific override is active
- [x] the invocation area is simplified to category selection plus one invoke action
- [x] a reviewer can easily understand and validate the relationship between Default inheritance and category-specific overrides from the demo UI
