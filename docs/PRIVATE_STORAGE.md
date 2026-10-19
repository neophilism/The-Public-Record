# TPR-09 private object quarantine — initial capability contract

**Current status:** signed, bounded capability tokens, a database-backed one-time intent ledger, and isolated B2 Native API v4 private upload/download transports are implemented with synthetic tests. No real bucket, credential, upload endpoint, malware scanner or production encryption attestation exists.

## Storage ownership and privacy

1. Each quarantined original is private; the server must never expose a public B2 object URL or use a publicly listed/readable bucket for original evidence.
2. The upload-intent issuer requires a verified account and server-loaded draft owner, matching the same authenticated subject. Untrusted client-supplied `ownerSubject` is not authoritative.
3. Object keys use `private/quarantine/v1/` with keyed pseudonymous issuer-and-subject tags and random UUIDs; raw requester identity does not appear in the storage path. Even pseudonyms are sensitive metadata.
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

## B2 transport evidence and limits

The server-only uploader verifies a bucket-restricted key, `allPrivate` bucket mode, SSE-B2 AES256 settings, a provider-owned HTTPS upload host, exact object key/checksum/length receipt and the 50 MiB item ceiling. It returns file ID and SHA-256 metadata, never a public URL. This follows Backblaze's [authorization](https://www.backblaze.com/apidocs/b2-authorize-account), [bucket listing](https://www.backblaze.com/apidocs/b2-list-buckets), [upload URL](https://www.backblaze.com/apidocs/b2-get-upload-url) and [file upload](https://www.backblaze.com/apidocs/b2-upload-file) contracts checked 2026-10-19. The transport is not wired to a live credential or user endpoint; durable aggregate spending caps, malware scanning and ownership binding remain mandatory before enabling uploads.

The private downloader additionally requires a server-owned file ID, key, SHA-1 and byte count; it verifies provider file headers and the streamed body digest under the same bucket/privacy/key restrictions. It follows Backblaze's [download-by-ID](https://www.backblaze.com/apidocs/b2-download-file-by-id) contract checked 2026-10-19. No direct browser download URL is produced. Durable ownership lookup and authorization remain the caller's responsibility until the private endpoint is integrated.

The permit and read checks bind both issuer and subject, and the permit-claim ledger applies issuer-and-subject RLS. The existing draft table on this branch still lacks issuer ownership; TPR-08's issuer-scoped draft migration must be integrated before enabling the claim endpoint. No current helper call proves live provider identity or authorizes a browser upload.
