# Public archive citation bridge

Each reviewed public document has a stable local citation anchored to its byte hash and a stored digest of the reviewed source-page snapshot. A matching public archive item may be linked by identical byte hash, but an outage or missing match leaves the local citation and provenance intact. Deduplication uses kind plus byte hash so a release and correspondence are never collapsed into the same record.

This projection accepts only reviewed public derivatives. The live FOIA Aggregator contract, source snapshot retention, independent URL review, page rendering and public ingest adapter still need integration and live tests. No private quarantine bytes are sent to an archive by this module.
