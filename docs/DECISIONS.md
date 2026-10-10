# Decision and interpretation register

Source of truth for product intent: [complete development plan](DEVELOPMENT_PLAN.md) sections 1–5, 9 and 12. The distinctions below are **normative for handoff**.

## Approved civic-product requirements (A-series)
| ID | Approved requirement |
|---|---|
| A-01 | Questions and investigations are anchored to attributable evidence and appropriate federal agencies/components. |
| A-02 | Individuals consciously adopt and **self-file** prepared FOIA requests under their own names via official channels. No automated mass filing or requester impersonation. |
| A-03 | The public sees privacy-respecting request/response progress, without leaking private drafts, correspondence or contact details. |
| A-04 | User-facing lifecycle retains unclaimed, adopted, submitted, acknowledged, released/partial/denied, appeal and archive distinctions. |
| A-05 | Exactly eight companion initiatives are in scope: Redaction Gallery, Missing-Records Wall, Silence Clock, Public Receipt, One Citizen One Question, Read the Record, Document Hunts and Walking Archive. |
| A-06 | Value substantive, source-backed discovery and verified participation rather than request-volume leaderboards. |
| A-07 | Prefer electronic delivery, participant-set fee ceilings, evidenced timestamps and field/item-specific publication controls. |
| A-08 | Integrate the investigative loop: question → investigation → existing disclosures → citizen request → reviewed documents → gaps → new questions. |

## Engineering baselines, not historic approvals (E-series)
| ID | Current implementation baseline | Change rule |
|---|---|---|
| E-01 | Next.js + TypeScript, API/domain boundaries | ADR with tests, equivalent requirements |
| E-02 | Neon/PostgreSQL for private transactional data | No real credentials until configured; migration and rollback acceptance |
| E-03 | Private Backblaze B2 for quarantine/originals | Separate authorized publication object storage and cost ceilings |
| E-04 | FOIA Aggregator supplies existing public released records | Versioned read-only metadata/search adapter; no cross-project database access |
| E-05 | Justice For All supplies future parent navigation and user identity | OIDC contract; no implicit trust until implemented |
| E-06 | Engine Room consumes approved roadmap and verified PR mappings | Never count commits, issue numbers or unverified claims as accepted work |
| E-07 | Liberty Nodes may replicate **reviewed publicly releasable** records only | Never mirror private evidence, user correspondence or draft requests |
| E-08 | E2EESA security controls selected by component/data flow | Do not claim global E2EE, standard certification or production assurances without evidence |

## Hard prohibitions
- No guarantees of statutory FOIA response dates or that agency records exist.
- No public classification of accusations as proved without document-specific evidence.
- No automatic publication of uploaded files, requester PII, third-party sensitive data or unreviewed releases.
- No claiming agencies received a request solely because a requester checked "sent".
- No cross-party gatekeeping or paid service activation without approval.
- No bypass of government access restrictions, CAPTCHA or rate limits.

## Open integration dependencies
- Agency channel metadata must be source-verified and have freshness status.
- Provider-issued identity/session trust and key handling will be decided at TPR-07.
- FOIA Aggregator data contract is introduced in TPR-02 and exercised with real approved endpoints only in later work packages.
- Production publication/editorial governance requires human approval and cannot be bypassed by local fixtures.
