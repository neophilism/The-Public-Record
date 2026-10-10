# TPR-11 — FOIA.gov agency/component synchronization

**Status:** official JSON:API adapter and synthetic contract tests. No live API key has been provisioned to The Public Record, no hosted refresh worker and no database sync job have run.

## Official source

FOIA.gov's [developer resources](https://www.foia.gov/developer/) document the public, API-key-protected agency component endpoint:

`https://api.foia.gov/api/agency_components`

Use server-side `X-API-Key`; the agency-receiving interface is **not** a general third-party request-submission API and will not be used to file requests on behalf of participants.

## Adapter guarantees

- Read-only JSON:API response parsing, verified UUID component IDs, descriptive title, optional abbreviation, parent agency ID/name and observation timestamp.
- Bounded iteration with same-origin, HTTPS-only `links.next`, at most 100 pages and at most 5,000 records; rejects external pagination and repeated URLs.
- API key stays in server-only configuration and does not appear in browser data structures or logs.
- Retries on transient failures are bounded; if any page cannot be verified, the adapter returns the *last complete approved snapshot* marked stale, never a silently partial fresh result.
- Return explicit `unconfigured` or `unavailable` status if no key/usable cache exists.
- Raw agency data is directory information, not a legally sufficient, currently verified FOIA filing address; TPR-12 must separately review the request form/channel and last-verification date.
- All contract tests use invented component metadata and a synthetic key, without contacting the federal service.

## Remaining production tasks

1. Obtain and provision an authorized FOIA.gov API key as a server-side secret without copying another project's secret or exposing it in source.
2. Persist versioned last-good snapshots and component changes in PostgreSQL, with verified timestamps and source identifiers.
3. Add bounded worker scheduling, rate-limit observance, review/override rules for changed instructions and outage monitoring.
4. Test against a real authorized FOIA.gov response and ensure source schema/agency hierarchy mismatches surface visibly.
5. Add the participant-facing agency finder and qualified self-filing instructions only after data quality and privacy acceptance.

Cross-system FOIA Aggregator integration is separate: that repository owns already released records and search, while this adapter reads the federal agency directory.

**No real request is sent by this work package.**
