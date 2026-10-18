# TPR-22 — Participant reports and agency receipt evidence

The `filing-receipt` parser accepts only a draft ID, filing date, optional reported case number and optional proof digest. Every parsed report is labeled `participant_reported_unverified`; the browser cannot supply a source, reviewer flag or agency-confirmed status. A reported case number does not establish that an agency received or accepted the request.

Proof bytes, if later enabled, belong in private quarantine storage. The server must calculate and compare SHA-256 from retained bytes; a hash supplied by a participant is not independent verification. The current `proofMatchesDigest` helper detects byte changes but does not authenticate the document's sender.

Before a live report endpoint: require an active verified session, object-level ownership checks, a scoped private database role, rate limits, audit events, a private scanned upload pipeline and a distinct reviewer-controlled path for agency acknowledgements. No current route stores a report, uploads proof or marks a request agency-confirmed.
