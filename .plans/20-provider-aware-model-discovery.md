# Plan 20: Provider-aware model discovery with optional context

## Goal

Add provider-aware model discovery to `@evergraytech/ai-config` so the package can fetch, normalize, cache, and expose advisory model identifiers for UI consumption without coupling discovery to execution.

The initial delivery should support one unified async discovery API, preserve the current synchronous model-reading posture, and improve UX for fast-moving providers such as OpenRouter.

## Why this exists

Today, `ai-config` primarily relies on static provider model lists. That works for curated defaults but creates friction when provider catalogs evolve quickly or when users need exact valid model identifiers for BYOK flows.

This is especially painful for OpenRouter, where model identifiers are broad, dynamic, and frequently updated. Users should be able to discover usable identifiers instead of guessing strings manually.

At the same time, discovery must remain advisory only:

- it must not block execution
- it must not become a required precondition for invoke
- it must not force `ai-gateway` changes
- it must not validate models at execution time

## Scope

### In scope

- add a provider-aware async model discovery API with optional provider-specific context
- preserve a synchronous `getAvailableModels(...)` read path for existing consumers
- support dynamic discovery for OpenRouter via its public browser-safe endpoint
- support optional dynamic discovery for OpenAI when a BYOK API key is supplied
- provide curated advisory fallback lists for Anthropic and Gemini
- normalize fetched provider model payloads into package-friendly model descriptors
- cache discovery results in memory per session
- optionally persist discovery results to browser `localStorage` with TTL
- ensure model discovery is ready for UI dropdown/autocomplete consumption
- keep manual model entry supported even when discovery data exists

### Out of scope

- changing `ai-gateway`
- enforcing discovered-model membership during execution
- requiring discovery to run before invoke
- server-side proxying for provider model discovery
- secure remote storage of provider credentials
- exact provider capability validation or exhaustive model taxonomy correctness

## Public API direction

### New async discovery API

Add a new async API dedicated to provider-aware discovery:

```ts
discoverAvailableModels(
  provider: Provider,
  context?: {
    apiKey?: string;
    forceRefresh?: boolean;
    signal?: AbortSignal;
  }
): Promise<ModelInfo[]>
```

Behavior:

- fetches or resolves advisory models for the target provider when supported
- normalizes returned data into package model descriptors
- stores results in cache
- never throws for missing API key or transient network failure
- returns cached results or `[]` on failure

### Existing sync read API

Preserve synchronous read semantics:

```ts
getAvailableModels(provider: Provider): ModelInfo[]
```

Behavior:

- returns cached discovered models when present
- otherwise returns the static/fallback registry list
- remains usable by existing UI and state logic without forcing async adoption everywhere

## Discovery context semantics

The optional discovery context should remain provider-agnostic but provider-aware in behavior:

- `apiKey` — optional provider credential used only when required by a provider discovery source
- `forceRefresh` — bypass in-memory/local cache and refetch when possible
- `signal` — optional cancellation support for browser fetch usage

The API must not persist or log raw API keys.

## Normalized model shape

Discovery results should normalize into the existing model-descriptor-friendly shape used by the package UI and registry, with room for metadata enrichment.

Minimum normalized shape:

```ts
{
  id: string;
  provider: Provider;
  label: string;
  metadata?: {
    contextLength?: number;
    pricing?: Record<string, unknown>;
    raw?: unknown;
  };
}
```

Notes:

- `id` is the canonical model value
- `label` may use a provider-returned display name when available, otherwise falls back to `id`
- metadata is best-effort only and should not block consumption
- if practical, the implementation should reuse/extend `AIModelDescriptor` instead of inventing a disconnected duplicate type

## Provider rules

### 1. OpenRouter (dynamic, required for first phase)

- endpoint: `GET https://openrouter.ai/api/v1/models`
- no API key required for discovery
- normalize every returned model into `provider: 'openrouter'`
- extract:
  - `id` (required)
  - `name` or equivalent display field for label when available
  - optional metadata such as context length and pricing when available

OpenRouter is the primary driver for this work and should be the first fully implemented dynamic provider.

### 2. OpenAI (dynamic, optional but supported)

- endpoint: `GET https://api.openai.com/v1/models`
- requires `Authorization: Bearer <OPENAI_API_KEY>`
- if `apiKey` is not supplied, return `[]` without error
- filter results to relevant generation/chat-capable models using a lightweight heuristic
- extract `id`
- normalize into `provider: 'openai'`

This should be treated as advisory discovery only and must not affect whether the user can still manually type a model.

### 3. Anthropic (static list for now)

No public browser-friendly model-listing endpoint is assumed for this phase.

Provide curated soft-default advisory models:

```ts
[
  'claude-3-5-sonnet-20240620',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307',
]
```

These remain non-enforced fallback options only.

### 4. Gemini (static list for now)

No stable public browser-appropriate model-listing endpoint is assumed for this phase.

Provide curated soft-default advisory models:

```ts
['gemini-1.5-pro', 'gemini-1.5-flash']
```

These remain non-enforced fallback options only.

## Caching strategy

### Required cache

- in-memory per-session cache
- provider-scoped storage
- deduplicate concurrent in-flight fetches per provider/context class

### Optional persisted cache

- browser `localStorage` cache with TTL (target: ~1 hour)
- browser-safe implementation
- stale entries should be ignored or refreshed

### Cache key rules

Cache keys should include:

- provider id
- API key presence as a boolean only

Do **not** store the raw API key in cache keys, cache payloads, logs, or persisted browser storage.

## Error handling posture

Discovery should be non-fatal.

Rules:

- never throw for missing API key
- never throw for fetch/network failure in the normal public discovery path
- return cached list if available
- otherwise return `[]`
- optionally surface a non-fatal warning for debug/developer visibility

Discovery must not interfere with normal package config or invoke flows.

## Integration with existing flow

- do not change the invoke contract
- do not require discovered models to be present before invoke
- do not validate execution requests against discovered models
- keep manual model entry fully supported
- allow UI consumers to use discovered data for dropdowns, autocomplete, and friendly selection surfaces

The intended usage pattern is:

1. UI may call `discoverAvailableModels(...)`
2. package caches normalized advisory models
3. UI reads synchronously via `getAvailableModels(...)`
4. user may still manually enter a model not present in discovery results

## Architecture direction

### Suggested internal layering

- `src/core/providers/discovery/` or similar for provider-aware discovery logic
- provider-specific resolvers/fetchers kept isolated from the static built-in registry
- shared normalization helpers for remote payload adaptation
- shared cache helpers for memory + optional `localStorage`

### Suggested responsibilities

- static built-in registry remains the fallback/default source of model descriptors
- discovery layer overlays advisory results into cache
- `getAvailableModels(...)` consults discovery cache first, then falls back to static provider definitions
- app-level `modelFilter` behavior should be preserved when practical for both discovered and fallback model sets

## Testing expectations

Add coverage for at least:

- OpenRouter payload normalization
- OpenAI payload normalization and missing-key behavior
- Anthropic and Gemini curated fallback discovery behavior
- in-memory cache reuse
- localStorage TTL behavior if persisted cache is implemented in this phase
- in-flight request deduplication
- network-failure returns cached-or-empty behavior
- assurance that manual model usage remains allowed outside the discovered list

## Documentation expectations

Update docs to clarify:

- discovery is advisory UX enhancement only
- execution remains flexible and manual model entry is still allowed
- OpenRouter uses public browser-side discovery
- OpenAI discovery is optional and requires a user-supplied API key
- Anthropic and Gemini use curated static lists in this phase

## Acceptance criteria

This plan is complete when:

- [x] `discoverAvailableModels(...)` exists as a provider-aware async API with optional context
- [x] `getAvailableModels(...)` returns discovered cached models when available, otherwise fallback/static models
- [x] OpenRouter dynamic discovery is implemented and normalized for UI use
- [x] OpenAI optional authenticated discovery is implemented without breaking missing-key behavior
- [x] Anthropic and Gemini return curated advisory fallback lists
- [x] discovery results are cached in memory, with optional browser persistence if implemented
- [x] fetch failures do not block execution or throw through normal UI flows
- [x] docs and tests reflect the advisory-only, non-enforced model-discovery posture
