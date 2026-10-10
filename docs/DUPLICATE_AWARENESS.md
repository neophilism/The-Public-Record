# TPR-16 — Search existing records and avoid unnecessary duplicates

**Status:** pure matching contracts and synthetic negative tests, not live FOIA Aggregator or request-database search.

Before presenting a request as a new actionable need, search for already released records and existing public request activity. The normalization key includes exact federal component ID, requested date range and canonicalized scope text, and is SHA-256 hashed. An exact matching fingerprint is a research hint, **not evidence that the documents are complete or that another individual's request is legally duplicative**. We intentionally do not suppress legitimate distinct requests. Unmatched titles are not presented as confirmed identical disclosures.

Only reviewed publicly releasable record links and public request identifiers may enter this matcher; personal requester identities and private drafts must never be exported to the aggregator. Similarities are warnings requiring participants' recorded decisions where a relevant public match exists. Decisions to file separately remain possible with a documented explanation; the system never files automatically.

**Remaining integration:** TPR-15 FOIA Aggregator's future versioned public API, actual read-only search, source completeness warnings, persisted matching snapshots, reviewer override audit, bounded search indexing and meaningful non-volume participation incentives. No live user request is transmitted by this module.
