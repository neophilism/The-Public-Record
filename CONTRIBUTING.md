# Contributing to The Public Record

## First-session checklist
1. Read [the complete plan](docs/DEVELOPMENT_PLAN.md), [decisions](docs/DECISIONS.md), [P0 acceptance gates](docs/P0_ACCEPTANCE.md), [implementation status](docs/IMPLEMENTATION_STATUS.md), and [security policy](SECURITY.md).
2. Inspect the actual remote branches, CI outcomes, migrations and deployed services. A checked box in a plan never proves deployed behavior.
3. Choose the next dependency-ready work package and create a reviewable branch and PR.
4. Include tests and documentation with every change. Never merge failing or unreviewed security-sensitive work.
5. Associate merged PRs with work IDs only after validating package-specific acceptance evidence. Bootstrap commits are not a completed work package.

## Development conventions
- Node.js 22+; run `npm install`, `npm run typecheck`, `npm test` and `npm run build`.
- Keep the public archive and private participation data in separate, explicitly governed data flows.
- All mutations require authenticated and server-authorized handlers; avoid client-trust shortcuts.
- Do not introduce live-user data, production credentials, example real identities or paid services in tests.
- All outbound adapters must have deterministic offline fixtures and reject unknown schemas instead of silently assigning fields.
- Use stable work IDs `TPR-01` through `TPR-52` in PR descriptions, acceptance evidence and Engine Room mapping.
- Use small PRs that do not silently change product decisions; preserve the privacy-first publication defaults.

## Required PR template
**Work IDs:** `TPR-XX`  
**Scope:** implementation and integration boundaries  
**Tests and evidence:** commands, results and linked CI  
**Security/privacy:** data-flow and disclosure effects  
**Deployment:** migrations, flags, secrets, rollback, and cost impact  
**Acceptance:** explicit work-package gate status (complete/partial/blocked)

## Blockers requiring owner approval
Real-user publication and disclosure policy changes, paid spending, identity-provider trust decisions, security exceptions, or legal/rights adjudications. Routine implementation details do not need product-owner decisions.
