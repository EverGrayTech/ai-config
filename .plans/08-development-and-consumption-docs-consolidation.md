# Plan: Development and Consumption Docs Consolidation

## Objective
Create dedicated maintainer and consumer documentation so repo workflows live in `docs/development.md` and downstream integration guidance lives in `docs/consumption-guide.md`, with `README.md` serving as a shorter front door rather than the primary home for everything.

## Customer Value
- Makes package-maintainer workflows easier to find and keep current
- Gives downstream developers a clearer integration entrypoint
- Reduces documentation sprawl and repeated guidance across README and system-level docs

## Scope Decisions (Locked)
- `docs/development.md` is the canonical source for repo-maintainer workflows
- `docs/consumption-guide.md` is the canonical source for downstream package integration guidance
- `README.md` should remain useful, but it should primarily orient readers and link to deeper docs
- Documentation should consolidate existing relevant guidance rather than duplicating it indefinitely

## Prerequisites
- `docs/system-spec.md`
- `.plans/07-local-demo-app-and-validation-harness.md`

## Implementation Checklist

### 1. Audit and Classify Existing Documentation
- [x] Identify current maintainer-workflow guidance spread across README, plans, and other docs
- [x] Identify current downstream-consumption guidance spread across README and system-level documentation
- [x] Separate content that belongs in system specification vs development workflows vs consumer guidance

### 2. Create `docs/development.md`
- [x] Document local setup and install expectations for working in this repo
- [x] Document core maintainer commands (`typecheck`, `test`, `build`, linting, and any future demo commands)
- [x] Document how to run and use the local demo app for UI validation
- [x] Document how to validate neutral styling and optional design-system-aware styling
- [x] Consolidate expectations for updating tests/docs/plans when package behavior changes

### 3. Create `docs/consumption-guide.md`
- [x] Document what downstream apps should install and import
- [x] Document headless usage, React usage, and stylesheet usage
- [x] Document optional design-system-aware styling behavior for EverGray Tech apps
- [x] Document host-app customization points, local-first caveats, and integration boundaries
- [x] Provide this file as the main entrypoint for downstream developers integrating the package

### 4. Refactor README Posture
- [x] Reduce README duplication by linking to `docs/consumption-guide.md`, `docs/development.md`, and `docs/system-spec.md`
- [x] Keep README effective as a concise package overview and orientation doc
- [x] Ensure README still communicates the package purpose and local-first posture clearly

### 5. Validate Documentation Coherence
- [x] Confirm developer workflow guidance is no longer scattered unnecessarily
- [x] Confirm downstream guidance is easy to discover from the repo root
- [x] Ensure documentation matches the actual package exports, styling posture, and preview workflow

## Acceptance Criteria
- [x] `docs/development.md` exists and is the canonical maintainer-workflow reference
- [x] `docs/consumption-guide.md` exists and is the canonical downstream integration guide
- [x] `README.md` is shorter, clearer, and points readers to the appropriate deeper docs
- [x] Existing relevant workflow and integration guidance has been consolidated into the appropriate docs
- [x] Documentation reflects the actual package behavior and local demo workflow
