# TPR-08 — Authorization rules and server-owned role grants

**Current implementation:** domain policy, transaction scoping and append-only server-owned role grant events with subject/issuer RLS. No production private API gateway is enabled.

## Default denial

Only public questions marked published and official agency directory metadata are anonymously readable. Every private request, correspondence record, draft, quarantine file and consent grant must be owned by the verified subject. Admin and operator roles do not automatically gain access to another individual's private content.

| Resource | Allowed capability | Principal constraint |
|---|---|---|
| Published question | Read | Anyone |
| Public question draft | Create | Authenticated contributor/editor/admin; moderation workflow still required |
| Agency registry | Read/manage | Public read; admin only for changes |
| Private request draft | Read/create/update/delete | Authenticated owner who has requester role |
| Private evidence reference | Read/create/delete | Authenticated requester-owner |
| Consent grant | Read/update | Authenticated requester-owner |
| Case note | Read owner; assigned editor read/update | Named assignment, not generic editor role |
| Publication review candidate | Read/review | Named records reviewer, not owner, with explicit owner review grant |
| Redacted audit index | Read | Admin/operator only; no raw participant content |
| Role assignments | In-band escalation prohibited | Privileged provisioning needs a separate recorded approval process |

The active role set is the latest grant/revocation event per role, loaded by `withRolePrincipal` inside a transaction bound to a verified issuer and subject. A runtime database role needs SELECT only; only a separate offline provisioning role may append grant events. The application role list is `requester`, `contributor`, `researcher`, `editor`, `records_reviewer`, `moderator`, `admin`, `operator`. Visitor is represented by no authenticated user. Clients may request an action but never choose their own server role, role-granting authority or assignment.

## Database access

`withPrivateSubject` uses a single transaction, `SELECT set_config('tpr.subject',$1,true)`, and guaranteed transaction completion + pool release. This setting must originate from a verified session, not a browser-provided string. Postgres runtime credentials need a separate non-superuser/non-owner, `NOBYPASSRLS` role; testing as the owner or a privileged role alone is not proof of isolation.

**Defense in depth:** Even with RLS, all private API routes must enforce object access on the backend. SQL injection or uncontrolled client SQL would defeat any attacker-settable custom GUC, so use parameterized queries, least-privilege credentials and validated routes.

## Remaining checks

- Verify the OIDC session through the active session registry before calling `withRolePrincipal`, and provision project role grants through a distinct audited operator process.
- Add real authenticated API handlers that call `authorize()` and `withPrivateSubject()` before every private operation.
- Expand RLS integration tests for cross-user reads/writes across all private tables and validate runtime role grants, not database-owner bypass paths.
- Add durable assigned-case access, consent revocation and audit trails; map user deletion to resource owners.
- Penetration testing, E2EESA profiles, abuse-rate protection and real tenant-separation verification remain required.

**No user-upload feature is enabled by this module alone.**
