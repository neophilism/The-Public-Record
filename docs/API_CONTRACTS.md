# TPR-04 Public API and domain schema contract

The schema baseline is [OpenAPI 3.1](../openapi/public-record-v1.json). It currently documents **only the actually implemented** `GET /api/health` endpoint. All other schemas are proposed contracts for future authenticated handlers and are not user-accessible API guarantees.

## Invariants
- Public questions contain **no private contact details, draft notes, user identity claims or unpublished correspondence**. The public field projection uses an explicit allowlist.
- `document_confirmed` and other positive source-backed claims require citation identifiers; these references must later be checked against published source documents.
- Public claims and missing-record states use separate enums: a missing record is not evidence of unlawful destruction or concealment.
- A requester may report submission, but `acknowledged`, `released`, `denied`, and related agency states require verified agency-document provenance. `archived` requires a reviewed publication event.
- A validly shaped evidence reference alone does **not** prove authenticity; object authorization and reviewer verification must be implemented before accepting untrusted client events in TPR-07–10.
- Pagination is bounded, and idempotency keys must be scoped to an authenticated actor, operation and request body hash in storage before mutation endpoints are enabled.
- A private storage object can never become public merely because its corresponding request state changes to `released` or `archived`. Publication is a separate explicit consent and review workflow.

## Envelope conventions for planned APIs
- Error envelope: `{ code, message, correlation_id? }`, with stable safe codes and no leaked internals.
- Cursor/page limits: 1–100 results per page and bounded page indexes; future cursor pagination should use opaque, signed tokens.
- Per-request idempotency: client key syntax validation is only the first step; server-side durable key replay/conflict protection is mandatory.
- Dates: retain exact evidentiary source and observation timestamp, differentiating requester report from agency-received date.
- Sensitive fields: draft text, requester name/address, correspondence, full receipts and unpublished evidence stay in private records and must never appear in public DTOs.

## Negative fixtures
Unit tests cover unsupported transitions, absent agency evidence, unsupported schema versions, unexpected private fields, revoked publication grants, overlarge result sets and loss of upstream service. These tests are necessary but not sufficient for production acceptance.
