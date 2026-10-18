# Versioned publication and withdrawal

Consent and editorial approval apply to the exact derivative ID, version, SHA-256 and selected fields. A preview should show only the intersection of those two sets. A withdrawal event clears eligibility and flags cache purge. A later grant must be a new explicit event; consent does not carry to a revised derivative.

The event projection is a domain component. A real publication service still needs authenticated actors, append-only durable events, publication scan proof, materialized public views, cache invalidation with acknowledgement, and takedown verification. Until those are wired, this module produces no public URL and cannot assert that withdrawal propagated to caches or replicas.
