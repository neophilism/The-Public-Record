# Security and privacy

The Public Record handles sensitive draft inquiries, participation metadata and potentially identifying records.

- All participant uploads and drafts are private by default; explicit item-specific authorization is required for public release.
- Public archival storage must never accept private payloads by default.
- Never log private document contents, session tokens, access credentials or personal addresses.
- Verify authorization server-side for every private read and write. No client-supplied role overrides.
- Rate-limit risky endpoints and validate untrusted input using schemas.
- Do not claim E2EESA conformance based on a configuration or unit-test pass. Inventory components and flows and maintain actual evidence.
- Requesters file their own FOIA requests through the official agency channels.
- Never publish real participant data from tests, seed data or development environments.
- Security reports should be kept private; do not publish exploitation details while unresolved.

See [the full specification](docs/DEVELOPMENT_PLAN.md) for threat modeling, release gates, data handling, and response procedures.
