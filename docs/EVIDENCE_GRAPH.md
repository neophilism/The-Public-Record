# TPR-14 — Evidence provenance and citation relationships

**Status:** typed, offline citation-graph validation and exact-source SHA-256 helper; no live source store, public URL-checking worker or production-citation API is enabled.

Every public citation resolves to a uniquely identified source and an optional page/section reference. Original-versus-derivative relationships are explicit; missing linked sources, duplicate IDs and circular derivatives are flagged. Source observation/publication dates remain distinct. A SHA-256 digest is attached only when source bytes were actually available for hashing, never guessed from a link or a description.

The validator rejects unsafe link protocols and internal/local targets; it does not follow source URLs, defeat rate limits or treat a reachable URL as proof of the claims made on it. The editorial workflow must still verify whether a quoted passage supports its precise assertion and preserve contradictory evidence and corrections.

Operational acceptance under TPR-14 requires durable citation tables, audited upload hashes, document/version links, source-original preservation, broken-link monitoring, accessible page and section navigation, and validated public projections. These tests use fabricated source IDs and synthetic content, not real participants or allegations.
