# Demo Validation Role

## Purpose of `examples/demo-app`

- Treat `examples/demo-app` as the package's **1:1 downstream validation surface**.
- The demo is intended to validate how a real consuming app will experience the current package version before downstream apps adopt or upgrade to it.
- The demo should exercise realistic composed flows, package defaults, edge cases, and failure states using the same public APIs available to external adopters.

## Decision framing

- Bugs, features, and UX improvements in this repository are done **for downstream apps first**, not for the demo as an isolated product.
- Changes made in the demo should primarily help confirm whether the package is safe and intuitive for real adopters.
- Do not treat demo-only workarounds as sufficient if the underlying issue would still affect consuming apps.

## Validation expectations

- Before considering a package change complete, ensure the demo reflects the intended real-app behavior closely enough to act as a pre-adoption validator.
- When a bug appears in the demo, first ask whether it reveals a package issue, an integration issue, or a demo-only presentation issue.
- If a demo-only enhancement is added, document why it improves validation fidelity for downstream adopters rather than merely polishing the demo itself.
