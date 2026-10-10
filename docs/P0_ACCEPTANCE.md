# P0 gates and traceability — The Public Record

This gate list is authoritative for initial product safety; full criteria remain in the 52-package [development plan](DEVELOPMENT_PLAN.md). A mocked passing unit test does not certify production safety.

| Gate | Work IDs | Required independent evidence | State at initialization |
|---|---|---|---|
| Handoff and decisions explicitly preserved | TPR-01 | Plan, A/E decision register, manifest, contribution rules and nonfabricated status | in progress |
| External service contracts versioned | TPR-02, TPR-04 | Schema fixtures, parser and negative tests; no cross-service DB dependency | unverified |
| Component-level security classification | TPR-03 | Privacy/data-flow inventory, threat mitigation and selected E2EESA profile evidence | unverified |
| Fresh synthetic environment boots | TPR-05 | clean install/typecheck/test/build on CI; no production keys | scaffold only |
| Private DB boundaries and migration safety | TPR-06 | tests for schema, access, fresh and existing DB migrations, rollback | unverified |
| Identity and object authorization | TPR-07, TPR-08 | session and cross-account denial matrix | unverified |
| Private uploads and controlled disclosure | TPR-09, TPR-10, TPR-28–32 | forged/expired access denial, review chain and authorization | unverified |
| No automated/requester-impersonating filing | TPR-19–27 | human initiated, official channel, proof provenance, rate safeguards | unverified |
| Accurate FOIA determinations and timers | TPR-22–27, TPR-35 | verified receipt basis, separate calendar/statutory counters, appeal guidance | unverified |
| Public claims tied to actual sources | TPR-11–18, TPR-28–46 | provenance, correction traces and safe redactions | unverified |
| Safe public service and operator readiness | TPR-47–52 | deployment, recovery, privacy assessment, measured accessibility and incident exercise | unverified |

**Progress accounting:** 52 approved plan units != 52 merged PRs. Record each accepted package's PR number(s), reviewer, passing tests and live proof before updating `.exechub/approved-pr-mapping.json` or the Engine Room counter. Do not imply that the placeholder "in progress" is an acceptance result.
