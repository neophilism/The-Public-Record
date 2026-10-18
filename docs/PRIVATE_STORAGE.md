# TPR-09 private object quarantine — initial capability contract

**Current status:** signed, bounded capability tokens and a database-backed one-time intent ledger with owner-draft checks; no Backblaze B2 integration, bucket, upload endpoint, malware scanner or production encryption attestation exists.

## Storage ownership and privacy

1. Each quarantined original is private; the server must never expose a public B2 object URL or use a publicly listed/readable bucket for original evidence.
2. The upload-intent issuer requires a verified account and server-loaded draft owner, matching the same authenticated subject. Untrusted client-supplied `ownerSubject` is not authoritative.
3. Object keys use `private/quarantine/v1/` with keyed pseudonymous owner tags and random UUIDs; raw requester identity does not appear in the storage path. Even pseudonyms are sensitive metadata.
4. Upload intent is a 5-minute HMAC capability with allowed MIME types and a 50 MiB initial per-item ceiling. Server verifies the signature, authenticated subject, key prefix and expiry.
5. Capabilities are not proof that bytes are safe or legitimately obtained. Future ingress must independently sniff content type, verify byte count/checksum, malware-scan in isolation, reject oversized/archive bombs, log only redacted metadata and consume a one-time token in the implemented replay ledger before any upload.
6. The only storage adapter methods are write/read/delete **private** bytes; publication/replication must go through separate explicit consent and editorial review, never through a flag added to the original.
7. Access checks must use actual session identity plus server-owned object/draft membership; permission tests include cross-user, tamper and expiry scenarios.

## Required integration before production

- Create a distinct *private* B2 bucket (or isolated scope with equivalent access constraints) through an authorized workspace, no public bucket grants and no cross-project credentials.
- Provision least-privilege application keys through Render secret management; never commit or print them.
- Implement true private B2 adapter and usage/fee ceilings, retry/idempotency and object lifecycle/versioning.
- Apply the one-time intent ledger migration to a scoped database role, then persist scanned status, hash and ownership; connect it to a private upload endpoint with audit, revocation and quotas.
- Implement malware/type-safety pipeline and privacy screening before editorial review; encrypted-at-rest storage and TLS are not claims of end-to-end encryption against server-side workers.
- Test forged/cross-owner and expired access, wrong MIME/size, unauthorized direct B2 access and backup/restore from a separate runtime database principal.
- Capture applicable E2EESA control-level evidence; obtain review prior to real confidential submissions.

These steps are tracked under TPR-09, 10, 28–32 and 47–52. **Do not enable uploads or call TPR-09 operationally complete on the strength of this library alone.**
