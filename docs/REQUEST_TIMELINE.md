# TPR-23 — Causal request timeline projection

`rebuildRequestTimeline` orders transitions by their predecessor IDs, so late delivery does not reorder a case. Identical repeated IDs are idempotent. A reused ID with different content is rejected; competing branches, missing predecessors and invalid evidence leave the last unambiguous state intact and surface conflict IDs for review.

Corrections preserve the original event in history and mark it superseded. The replacement transition is checked against the same evidence gate as an ordinary transition. A correction that makes later events inconsistent stops projection at the corrected state and flags those later events. Partial releases and appeals use the existing request-state graph.

This is a pure projection. It does not authenticate authors, persist events, verify external agency documents, or authorize access to a participant's case. A live event writer must enforce owner/role checks, immutable storage, idempotency, causal references, evidence provenance and audit before feeding events into this projector.
