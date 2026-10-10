# TPR-23 — Rebuildable FOIA request event projections

**Status:** pure deterministic projection of typed request events and correction notices with synthetic tests. No durable event ingestion, participant dashboard, real receipt verification or audit logger is live.

The public case timeline distinguishes a *participant's report of submitting a request* from an *agency-verified acknowledgement*. Replayed events are ordered by trusted sequence, with duplicate IDs and conflicting transitions surfaced as explicit rejects rather than overwriting the current state. An addendum correction references the original event, retains the original event visibly as superseded, and rebuilds the effective state from the remaining supported transitions.

The public projection excludes private notes, evidence identifiers and uploaded proof references. Correctness still depends on independently validated source events, assigned reviewers and a trusted append-only database transaction. The projection **never** verifies the authenticity of an agency letter by itself and must not be exposed as an unmoderated API.

Operational acceptance requires durable authenticated participant event append, correction review and consent, idempotency ledger, temporal conflict resolution, appeal and partial production cases, staff evidence verification, DB rollback tests and API/display integration. The source history must never be silently rewritten. No mass filing is implemented.
