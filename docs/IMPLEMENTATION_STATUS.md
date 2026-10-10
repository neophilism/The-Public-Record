# Implementation and acceptance register

Baseline: October 10, 2026. Source of truth: [complete plan](DEVELOPMENT_PLAN.md).

## Rules

**A merged commit or a passing unit test does not automatically satisfy a work package.**
To mark TPR-XX complete, document its actual PR/commit, acceptance criteria, test results, operational evidence and reviewer decision. Missing evidence is **unverified**, not finished.

| Work IDs | Workstream | Planned | Verified completed |
|---|---|---:|---:|
| TPR-01–TPR-10 | Foundation, security, data | 10 | 5 |
| TPR-11–TPR-18 | Research and templates | 8 | 0 |
| TPR-19–TPR-27 | Citizen filing | 9 | 0 |
| TPR-28–TPR-32 | Document publication | 5 | 0 |
| TPR-33–TPR-40 | Public actions | 8 | 0 |
| TPR-41–TPR-46 | Integration | 6 | 0 |
| TPR-47–TPR-52 | Production | 6 | 0 |
| **Total** | | **52** | **5** |

## Early implementation commits

Initial repository, plan and scaffold commits are preparatory. They are **not** release acceptance or completion of any of the 52 units.

## Next action

Implement TPR-01 and TPR-02 against the full acceptance criteria; document evidence before approving these work IDs. Apply E2EESA per component and data flow rather than treating the entire repository as a single cryptographic class.

## Integration dependencies

FOIA Aggregator: public metadata/search with a versioned adapter.
Justice For All: navigation/SSO only after an authenticated and authorized contract.
Engine Room: approved roadmap manifest and explicit PR mappings.
Liberty Nodes: reviewed public documents only, never private files.

## Verified roadmap links

- TPR-01: [PR #1](https://github.com/neophilism/The-Public-Record/pull/1) — merged, CI green; plan, decisions, contribution and acceptance register.
- TPR-02: [PR #2](https://github.com/neophilism/The-Public-Record/pull/2) — merged, CI green; service contract, typed parsing and adapter tests.
- TPR-03: [PR #3](https://github.com/neophilism/The-Public-Record/pull/3) — merged, CI green; documented security inventory, threat register and publication policy tests. **No production crypto or storage assurance is claimed.**

Remaining TPR-04–52 have no accepted mapping. The evidence listed is repository-scoped only; deployed infrastructure and independent security review remain unverified.

## October 10 verification update

- TPR-04: [PR #4](https://github.com/neophilism/The-Public-Record/pull/4) merged after green CI; OpenAPI schema, evidence-gated state transitions and public/private projections.
- TPR-05: [PR #5](https://github.com/neophilism/The-Public-Record/pull/5) merged after green CI; synthetic fixtures, preview container, setup checks. **Partial package:** lockfile, explicit lint gate and container image acceptance remain outstanding; no accepted mapping.
- TPR-06: [PR #6](https://github.com/neophilism/The-Public-Record/pull/6) merged after green CI; PostgreSQL 16 migration integration tests covered fresh migration, rerun, checksum drift rollback, ownership foreign key, and runtime-role RLS. **This does not mean a Neon production database was provisioned or audited.**

The exact approved evidence mapping is `.exechub/approved-pr-mapping.json` with PR #5 explicitly unmapped. Production service acceptance remains separate from local CI acceptance.
