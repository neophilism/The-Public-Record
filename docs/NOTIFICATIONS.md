# Notification outbox boundary

The case-update outbox stores only a subject, an internal link, an idempotency key, and delivery state. A caller must append an explicit `subscribed` consent event before enqueueing. The enqueue SQL checks the latest consent event and ignores duplicate keys. Unsubscribe appends an `unsubscribed` event; consumers must recheck current consent before each delivery.

The outbox does not contain an email address, case body, or provider credential. The retry helper returns bounded delays and ends after five failures. No provider adapter, authenticated unsubscribe route, worker lease claimant, or live delivery is wired yet; these require the identity and credential integration. A worker must atomically claim pending/expired jobs with a short lease, refresh consent, resolve the recipient in a protected service, deliver once with an idempotency key, and record a minimal outcome. Do not describe these records as delivered mail until a real provider test succeeds.
