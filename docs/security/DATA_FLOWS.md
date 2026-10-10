# TPR-03 — Component/data-flow inventory and security claims

**Status:** design inventory and reference policy code, not deployed E2EESA certification. Revisit this inventory whenever a component or integration changes. E2EESA upstream is under audit remediation, so versioned profile eligibility requires an independent assessment. No blanket repository-level E2EE designation is justified.

| Flow ID | Origin → destination | Sensitive content | Security objective | Key and processing authority | Exposure and review |
|---|---|---|---|---|---|
| FLOW-01 | Visitor → public questions/search | Public input, optional query interests | Restrict logs/rate, TLS | Web service can read query | Avoid query body analytics and user-identifying logs |
| FLOW-02 | Requester → draft storage | Identifiers, addresses, private FOIA draft | Object authorization, encryption at rest/in transit, minimized retention | Initially server-accessible; future participant-held E2EE requires separate approved profile | Not E2EE against service |
| FLOW-03 | User → agency outside platform | Individual submission contents | User-initiated handoff to verified official channel | Government portal takes custody | The Public Record never submits as the user |
| FLOW-04 | Participant → correspondence timeline | Agency notices, receipt identifiers | Per-user authorization, provenance, integrity | Service currently can read content | Never public by default |
| FLOW-05 | Participant → quarantine | Uploaded sensitive originals or third-party PII | Malware/format scan, confidentiality and access logging | Worker must access plaintext to scan; scoped private storage | Do not call worker-scanned content provider-blind E2EE |
| FLOW-06 | Reviewer → consent and publication queue | Review annotations, redactions and rights decisions | Dual gate: informed item-specific participant grant + editorial approval | Authorizing humans/service | Consent withdrawal and correction events retained |
| FLOW-07 | Publication queue → public derivative | Explicitly selected, reviewed evidence | Provenance, redaction, content hash, public release | Deliberately public | Publish only derivative; never quarantine original |
| FLOW-08 | Published derivative → Liberty Nodes | Public manifest, citation, hash | Integrity, version history, corrections notices | Public by definition | Distribution may resist later deletion; warn before consent |
| FLOW-09 | Public archive adapter → Public Record | Public released FOIA source metadata | Strict schema, no identity leakage | Aggregator stores and indexes public data | No private drafts or participant IDs upstream |
| FLOW-10 | Development telemetry → Engine Room | CI work IDs, release IDs and aggregate status | Scoped observability | Operator/service | Never transmit names, user-submitted content, receipts, keys |
| FLOW-11 | Justice For All OIDC → participant session | Account ID, credentials/claims | Issuer/audience/signature/session validation | Identity provider authoritative | No browser-only role trust |

## E2EESA assessment requirements

- Inventory applies to **each component and protected flow**, not a whole repository label.
- Select applicable required invariants, capability profiles and any optional experimental alternatives only after examining the actual profile specifications for the version being adopted.
- Evidence must bind selected profile to a concrete build/commit, endpoints, recipient/key authority, encryption mode, metadata leakage, tests and reviewer.
- Intentional public exports are distinct from private protected content; explicit item-specific authorization is required.
- Server-side processing of unencrypted uploads negates claims that those uploads are E2EE against the service. Encryption at rest is different.
- No production eligibility or third-party certification is claimed from configuration checks.
- Log missing evidence, unsupported profiles, failed tests and unimplemented controls as **unverified**, not passed.

## Current implementation evidence

| Control | Code/path | Current status |
|---|---|---|
| Public archive DTO rejects unknown/private fields | `lib/contracts/archive-v1.ts` | Unit-test coverage; network integration still unavailable |
| Publication policy fail-closed predicate | `lib/security/publication-policy.ts` | Local domain rule, no server API/storage enforcement yet |
| Authentication, session integrity and RBAC | TPR-07/08 | NOT IMPLEMENTED |
| Private encrypted object quarantine and scanner | TPR-09/28 | NOT IMPLEMENTED |
| Key lifecycle and E2EESA implementation evidence | future security package | NOT ASSESSED |
| Production legal/privacy review and independent test | TPR-47/48 | NOT COMPLETED |

No real user content should be accepted until isolation, auth, audit and operational controls are accepted.
