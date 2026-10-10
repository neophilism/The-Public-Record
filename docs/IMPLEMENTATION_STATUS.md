# Implementation and acceptance register

**Planning baseline:** 2026-10-10. Canonical scope and 52 work packages: [development plan](DEVELOPMENT_PLAN.md).  
**Accepted:** 6/52 (11.5%). **Public production service:** NOT RELEASED.  
**Authoritative progress mapping:** [`.exechub/approved-pr-mapping.json`](../.exechub/approved-pr-mapping.json).

A merged PR alone does not mean an entire package is accepted. Acceptance requires the relevant CI and work-specific evidence; deployment, external service wiring and independent security review have additional gates.

| Work IDs | Workstream | Planned | Accepted | Unaccepted |
|---|---|---:|---:|---:|
| TPR-01–10 | Foundation, security, data | 10 | 6 | 4 |
| TPR-11–18 | Research and templates | 8 | 0 | 8 |
| TPR-19–27 | Citizen filing | 9 | 0 | 9 |
| TPR-28–32 | Documentary publication | 5 | 0 | 5 |
| TPR-33–40 | Eight public actions | 8 | 0 | 8 |
| TPR-41–46 | Platform integration | 6 | 0 | 6 |
| TPR-47–52 | Production and verification | 6 | 0 | 6 |
| **Total** | | **52** | **6** | **46** |

## Accepted foundation work (repository/CI level)

| Work | Evidence | Accepted scope |
|---|---|---|
| TPR-01 | [PR #1](https://github.com/neophilism/The-Public-Record/pull/1) | Approved-vs-engineering decision register, complete plan, contribution/handoff and acceptance specifications |
| TPR-02 | [PR #2](https://github.com/neophilism/The-Public-Record/pull/2) | Cross-service ADR, strict public archive JSON contract, read-only adapter with offline and negative tests |
| TPR-03 | [PR #3](https://github.com/neophilism/The-Public-Record/pull/3) | Per-flow security inventory, threat boundaries and tested publication policy; NOT an E2EESA conformance assertion |
| TPR-04 | [PR #4](https://github.com/neophilism/The-Public-Record/pull/4) | OpenAPI and evidence/state/public projection schemas with tests |
| TPR-05 | [PR #5](https://github.com/neophilism/The-Public-Record/pull/5), [PR #8](https://github.com/neophilism/The-Public-Record/pull/8), [PR #12](https://github.com/neophilism/The-Public-Record/pull/12) | Synthetic Next.js bootstrap, pinned lockfile, CI npm ci/lint/types/tests/build, non-root standalone image, Docker health smoke. PR #12 is the representative Engine Room mapping |
| TPR-06 | [PR #6](https://github.com/neophilism/The-Public-Record/pull/6) | Public/private PostgreSQL schema, transactional checksum migrations, foreign-key ownership and ephemeral PostgreSQL RLS integration tests |

**Important distinction:** This verifies repository-scoped acceptance of foundation packages. A production environment, live participant permissions, real filing workflow or secure-upload deployment has **not** been accepted.

## Partial foundations merged, not counted as accepted

- **TPR-07 — [PR #9](https://github.com/neophilism/The-Public-Record/pull/9):** PKCE/login prerequisites, pinned OIDC token validation, trusted JWKS source and short-lived session tokens. Still needs parent OIDC provider registration, callback exchange, revocation and live session tests.
- **TPR-08 — [PR #10](https://github.com/neophilism/The-Public-Record/pull/10):** role/object rule matrix and trusted transaction-scoped subject binding. Still needs authenticated API handlers, durable server-owned grants and end-to-end cross-user tests.
- **TPR-09 — [PR #11](https://github.com/neophilism/The-Public-Record/pull/11):** cryptographically signed owner-specific quarantine upload permits. Still needs isolated private B2 storage, replay ledger, scanner, key management, quotas and negative live-bucket tests.
- **TPR-10 — [PR #13](https://github.com/neophilism/The-Public-Record/pull/13):** append-only audit/consent event tables and retention tracking. Still needs restricted action emission, current-effective-consent service, external integrity checkpoint, operational and restore tests.
- **TPR-11 — [PR #14](https://github.com/neophilism/The-Public-Record/pull/14):** official FOIA.gov directory adapter submitted for review. Acceptance remains pending live source/authorized API key integration and persistence; verify CI/merge separately.

## Next dependency-ready steps

1. Finish TPR-07 provider integration using an authorized Justice For All OIDC issuer/client, and implement callback/cookie/session revocation.
2. Wire server-side TPR-08 controls into authenticated routes with non-owner, non-superuser PostgreSQL runtime credentials.
3. Complete private storage and scan pipeline (TPR-09, TPR-28) before allowing uploads. Never make original evidence public automatically.
4. Wire durable audit/consent event emission (TPR-10) and verify privacy-safe logging.
5. Advance FOIA.gov component data sync and verified filing-channel registry (TPR-11/12) without any automated third-party mass filing.
6. Update Engine Room only from the approved source manifest, exact merged PR mappings and verified evidence; do not confuse commits with package acceptance.

## Dependencies and non-goals

- FOIA Aggregator remains the public archive/search source; its direct versioned public JSON endpoint is not yet available.
- Justice For All is the proposed parent identity/navigation provider. No trust is granted to browser-provided role claims.
- Liberty Nodes may replicate **only approved public derivatives** with explicit additional consent.
- Render, Neon and private B2 production services have not been provisioned by these commits; no paid resources or shared project secrets should be assumed.
- The platform does not autonomously file FOIA requests, impersonate participants, claim agency acknowledgment without evidence, or publish unreviewed uploads.

**Handoff rule:** Before each session, inspect the actual GitHub, CI, deployment and database state. Treat missing evidence as unverified—not as completed.
