# TPR-12 — Verified self-filing channel registry

**Status:** review and destination-validation policies with synthetic tests; no live filing-channel database, agency portal integration or real recipient verification.

Every displayed filing destination must be tied to a verified FOIA.gov or independently verified agency source, a specific agency component ID, an authorized records editor and a current verification timestamp. Hostnames are compared against exact, server-owned reviewed lists; a similar-looking suffix does not qualify. Review is required again when a URL, channel kind, email recipient or source changes.

Two distinct guidance formats are modeled: verified HTTPS portal and verified agency mailbox. Both require *the citizen* to take the final action. No server route submits a request, follows arbitrary redirects or solicits participant credentials on another's behalf.

Review freshness currently expires after 90 calendar days; stale entries suppress the direct filing destination until someone reconfirms the agency's current instructions. This is a conservative engineering setting, not a FOIA legal deadline. Any outbound redirect must be separately validated against the reviewed host set.

The example destinations in automated tests are **illustrative test fixtures**, not claims that a real federal component uses those channels. Operational TPR-12 acceptance still requires two independently verified genuine agency form formats, a persisting reviewed registry, source comparison/redirect QA, and human approval. Direct filing remains disabled until those gates pass.

Official source: https://www.foia.gov/developer/
