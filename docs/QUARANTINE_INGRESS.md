# Private quarantine ingress gate

The inspection gate bounds bytes to 50 MiB, sniffs a small set of types, requires the declaration to match, obtains a scanner verdict within 15 seconds, then computes a SHA-256 digest. It returns metadata for private quarantine only; storage and publication are separate steps. Infected, unknown, timed-out, mismatched and oversized inputs fail closed. ZIP/Office archives remain rejected until an isolated parser can enforce expansion and entry limits, including zip-bomb tests.

This is an integration component, not a public upload endpoint or a claim of safe production storage. The private B2 bucket, one-time permit ledger, chunked or presigned transport, actual malware scanner, parser sandbox and deployment controls require separate credentials and live tests. No unscanned object may be copied to a public derivative.
