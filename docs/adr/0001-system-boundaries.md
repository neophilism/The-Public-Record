# ADR 0001: System ownership and integration boundaries

Status: **accepted engineering baseline**, 2026-10-10. See [approved product decisions](../DECISIONS.md) and [full plan](../DEVELOPMENT_PLAN.md). Architectural recommendations are revisable via a new ADR.

## Context and decision
The Public Record owns public investigations, requester-directed draft/request state, private correspondence/evidence workflow, publication approval and presentation of trustworthy citations. Its services must not independently duplicate or overwrite the FOIA Aggregator corpus. Cross-app database connections would create brittle, unauditable joins and expose confidential participant data.

| Service | Authoritative data | Direction | Privacy boundary |
|---|---|---|---|
| The Public Record | Investigations, question/request state, private drafts, consent, editorial review | Local ownership | Deny private export by default |
| FOIA Aggregator | Public FOIA archive source metadata, indexed public releases | Read-only public adapter into Public Record | Never send participant personal data upstream |
| Justice For All | Parent navigation, future OIDC identity authority | Identity proof/verified claims inbound | No shared DB or implicit trust of browser claims |
| Engine Room | CI/merged PRs, deployment/operational telemetry | Bounded authenticated status publishing | No document bodies, names, receipts or tokens |
| Liberty Nodes | Optional replicated approved published evidence | One-way, signed public release manifest out | Never replicate quarantine/private storage |

## Data-flow rules
1. Browser → Public Record is untrusted. Every private operation authenticates and authorizes against server-owned identity and object policy.
2. Investigations can render *public* metadata and source links, but source popularity is not evidence of verified wrongdoing.
3. Private evidence → isolated quarantine → staff/privacy review → user item-specific authorization → approved public derivative → archive/optional replication.
4. Only a reviewed public derivative and its public metadata can go to FOIA Aggregator or Liberty Nodes; originals and private correspondence remain internal.
5. End-to-end encryption claims apply only to implemented flows with keys not controlled by the server. Server-visible content may be encrypted at rest and in transit but is **not** E2EE against the server.
6. All third-party adapters start with explicit versions, schema validation, timeouts and safe errors. Unsupported versions must fail closed rather than reinterpret fields.

## FOIA Aggregator compatibility
As inspected at initial integration, `neophilism/FOIA_Aggregator/ui/server.py` exposes search via the **HTML homepage**, record pages under `/record/{document_id}`, and archives under `/archive/{document_id}`. It does **not yet advertise a versioned public JSON search endpoint** suitable for this adapter. Therefore, the Public Record supplies an **internal contract and deterministic fake transport only**; enabling live service search requires an approved versioned upstream endpoint, tests and URL/configuration review. Do not scrape privileged endpoints or couple to the Aggregator's SQLite schema.

## Alternatives rejected
- Reusing FOIA Aggregator's database directly: weakens isolation, creates writer/reader lifecycle races.
- Auto-filing on behalf of requesters: conflicts with conscious self-filing and agency authorization rules.
- Direct-to-public uploads: unsafe for PII and consent.
- Marking a matched document as proof of an allegation: source relevance does not establish claim truth.

## Consequences and proof
Contract tests reject unknown schemas/private fields; private-path tests and static import boundaries are strengthened in later TPR packages. This ADR does not assert operational deployment or E2EESA certification.
