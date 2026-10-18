# Cross-platform contracts — version 1 (internal proposal)

Implementation and legal boundaries: [ADR 0001](adr/0001-system-boundaries.md). These version numbers describe **The Public Record's internal interface**; they do not promise other repositories already expose them.

## FOIA Aggregator: `public-archive-search/v1`
Direction: only publicly released records and read-only metadata into The Public Record. Do **not** send requester names, emails, adoption state, unpublished allegations or private documents.

Required response envelope: `contract_version`, `source`, `observed_at`, `coverage`, and `records`. Unknown keys are invalid. Response is bounded to 100 records. Each record has `id`, `title`, `agency`, `source_url`, `record_url`, `sha256` (nullable) and `published_at` (nullable). URLs must be HTTPS with ordinary hostnames. SHA-256 hashes must be exact 64-hex characters. Unknown keys in record rows are rejected rather than accidentally logged or rendered.

`coverage` is `unknown`, `partial`, or `broad_not_exhaustive`. None means that every available record has been covered. Returned records may still require attribution and independent review before being used as evidence for allegations.

Adapter status must distinguish `not_configured`, `unavailable`, `invalid_contract`, `available`. It must not invent search results on outage or parse arbitrary upstream HTML as JSON. Operational adapter authentication is undefined until an upstream endpoint exists.

## Other intended contracts
- **Justice For All identity**: OIDC discovery, signed token verification and issuer/audience constraints; browser claims not directly accepted. TPR-07 implements.
- **Engine Room**: repository roadmap `.exechub/project.yml` and explicitly mapped PR numbers; operational status output never includes participant content. TPR-45 implements.
- **Liberty Nodes**: reviewed publication-manifest-only output, versioned content hash and correction/takedown signaling with permanence caveat. TPR-44 implements.

## Schema changes
Add `v2` rather than silently weakening `v1` privacy fields. Tests against synthetic fixtures are mandatory; then negotiate and verify the matching upstream producer contract.

## Guarded HTTP transport

`createPublicArchiveHttpAdapter` implements a read-only, bounded HTTPS GET for a configured public JSON endpoint. It sends only search text and a bounded limit, omits credentials, rejects redirects/HTML and returns errors as unavailable rather than an empty result. The resolver marks every result `exhaustive: false`; zero matches never prove that records do not exist. No upstream API URL has been verified or configured, so this remains an integration stub pending agreement and live contract tests.
