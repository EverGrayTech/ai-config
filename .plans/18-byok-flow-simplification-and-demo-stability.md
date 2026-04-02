# Plan 18: BYOK flow simplification and demo stability

## Goal

Make the bring-your-own-key flow more intuitive by collapsing scattered controls into a tighter provider-centric experience, while fixing demo validation issues that currently make BYOK appear unreliable.

## Why this exists

The current BYOK experience requires too many disconnected steps:

- users choose a general AI mode and then separately choose a provider
- provider configuration state is not visible in the selection control
- API key management consumes too much vertical space and relies on an explicit save action
- the selected BYOK state appears to reset during demo invocation, undermining trust in the feature

This phase should make the common BYOK flow feel like selecting a provider and optionally managing a key in-place.

## Deployment/hosting constraints

- The package remains a client-rendered React/TypeScript library with browser-local persistence.
- The demo app remains a Vite-based browser validation harness and must remain compatible with static-hosting-friendly deployment.
- Hosted validation should stay demo-configured and must not depend on repo-local backend runtime changes.

## Scope

### In scope

- replace the split mode/provider entry flow with a combined `AI Provider` selector
- keep the app-provided option in that selector using host-controlled label copy
- show BYOK provider configured state directly in the selector labels
- keep BYOK providers alphabetized for now
- compress API key management into a compact inline control with obfuscated saved-value behavior
- auto-save key changes using a debounced and/or blur-based interaction
- keep clear-key action inline and explain via tooltip that it removes the saved local key
- ensure provider/key state updates immediately when credentials are added or removed
- fix demo route-validation state instability so invoke no longer resets BYOK selection
- rename the non-categorized invoke action to `Invoke`
- include Google/Gemini in demo BYOK provider availability

### Out of scope

- changing the underlying headless state model away from separate mode/provider concepts
- introducing remote credential storage or backend secret management
- implementing configured-first provider ordering before it is needed

## Proposed implementation

### Phase 1: Demo stability and validation correctness

- [x] Stabilize the validation harness manager lifecycle so log updates do not recreate manager state.
- [x] Verify BYOK provider/model/credential state remains intact before and after invoke actions.
- [x] Rename single-route invoke controls from `Invoke default route` to `Invoke`.
- [x] Add Google/Gemini to relevant demo BYOK provider lists.

### Phase 2: Combined provider selection

- [x] Replace the split mode + provider flow with one `AI Provider` selector in the packaged panel.
- [x] Map the host-provided default option to app-provided/default mode.
- [x] Map all named providers to BYOK mode with immediate provider selection.
- [x] Show configured state inline in selector option labels.

### Phase 3: Compact key management

- [x] Rework API key management into a compact provider-tied control.
- [x] Reuse the field to show an obfuscated saved key when present.
- [x] Allow direct replacement by typing or pasting into the same field.
- [x] Auto-save replacement keys on blur and/or debounce rather than explicit save.
- [x] Keep `Clear` inline and add tooltip text explaining it removes the saved local key.

### Phase 4: Test and documentation updates

- [x] Update React tests to reflect the combined selector and compact key UX.
- [x] Add regression coverage for demo/provider state stability where practical.
- [x] Update docs only where public behavior expectations materially changed.

## Acceptance criteria

This plan is complete when:

- [x] BYOK no longer appears to reset during demo invocation
- [x] the panel uses a combined `AI Provider` control instead of separate mode/provider selection for the primary path
- [x] configured providers are visibly marked in the selector
- [x] the API key flow is compact, inline, and does not require a separate save button
- [x] clear-key behavior explicitly communicates local-storage removal
- [x] Gemini appears anywhere the demo is meant to expose the full supported BYOK set
