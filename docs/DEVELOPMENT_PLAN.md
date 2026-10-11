> **Canonical PR roadmap:** [`registry/roadmap.json`](../registry/roadmap.json). This detailed plan remains intact as the historical scope source; agents must edit the canonical file for PR counts and mapping.

# THE PUBLIC RECORD
## Comprehensive Software Development Plan and Independent-Account Handoff

**Program:** Justice For All / The Public Record (Mass FOIA Action)  
**Document ID:** TPR-DP-001  
**Version:** 1.0 planning baseline  
**Date:** October 10, 2026  
**Status:** **Complete development specification; implementation is NOT asserted.**  
**Recommended repository:** `neophilism/The-Public-Record` (create if absent; do not confuse this proposed name with an existing verified repository).  
**Upstream platform:** Justice For All Core Platform (shared site/identity/navigation).  
**Existing data dependency:** `neophilism/FOIA_Aggregator` (public document discovery and archive).  
**Security reference:** `neophilism/End-To-End-Everywhere-Security-Architecture-Standard` (E2EESA).  
**Portfolio observability:** `neophilism/Engine-Room`.

> **Handoff rule:** Another developer or ChatGPT account must be able to execute the plan from this document and the named repositories without consulting earlier conversations, relying on memory, guessing what was approved, or treating an unimplemented proposal as finished software. Validate repository and deployment state at the start of every work session. Do not publish credentials.

---

## 1. Product charter and confirmed decisions

### 1.1 Mission

The Public Record enables ordinary people to turn documented questions about possible government wrongdoing or missing public accountability into organized, accurate, citizen-directed inquiries. It connects a searchable catalog of public questions and investigations to records already available, prepared FOIA requests that individuals choose to file themselves, a transparent request-status ledger, safely published agency responses, a permanent archive, and follow-up investigations.

**Core loop:** `Question -> Investigation -> Search existing records -> Draft/Adopt request -> Individual files with agency -> Track -> Review/release evidence -> Public archive -> Documented gaps -> Next question`.

The work is investigative, documentary and educational. It is not necessary to take a position on whether an allegation has been proven in order to request records and investigate it. The site must distinguish allegations, supporting evidence, agency statements, contradictory evidence, and unresolved matters.

### 1.2 Decisions from the September 19, 2026 planning conversations

These are **approved scope**, not optional brainstorms:

1. Compile a navigable collection of documented federal wrongs, contested events and public questions, including evidence and the agency/component reasonably believed to hold relevant records.
2. Allow a citizen to **adopt a prepared FOIA request and file it under their own name** using the agency's official channel, by conscious individual action.
3. Keep participation simple, welcoming and appropriately gamified; award evidence discovery and meaningful contributions, **not a raw request-volume contest**.
4. Maintain a public, privacy-respecting ledger of requests and responses, with private draft and correspondence workflow.
5. Model the lifecycle: **Unclaimed -> Adopted -> Submitted -> Acknowledged -> Released / Partially released / Denied -> Appeal -> Archive**. Implement richer sub-states without erasing these user-facing milestones.
6. Include all eight approved public actions: **Redaction Gallery, Missing-Records Wall, Silence Clock, Public Receipt, One Citizen One Question, Read the Record, Document Hunts, Walking Archive**.
7. Express the integrated narrative as **questions -> investigations -> requests -> documents -> missing records -> new questions**, with physical/community expressions including questions, folders, receipts, clocks, public readings, walls and a walking archive.
8. Favor electronic record delivery, participant-controlled fee ceilings, verifiable timestamps and clear privacy choices.

### 1.3 Architectural recommendations made by this plan (not previous user approvals)

The following are recommended implementation choices, subject to ordinary engineering revision as long as requirements and security guarantees remain intact: Next.js/TypeScript user-facing app and API, Neon PostgreSQL for transactional data, Backblaze B2 for isolated file objects, a bounded document-processing worker, Render deployment, a versioned public FOIA Aggregator adapter, and a 52-work-package PR roadmap. Treat these as **the implementation baseline for handoff**, not as claims that accounts, services or secrets have been provisioned.

### 1.4 Specific results

- Anyone can search questions, investigations, known releases and gaps without registering.
- Someone who wants to act can complete a self-filed request using a verified agency pathway, without requiring legal sophistication.
- The participant controls when and whether their personal information, correspondence or released documents are made public; there is no default public sharing of private uploads.
- Editors can verify and connect responses to underlying records and publish source-backed, correction-friendly public materials.
- All eight companion actions work online and have printable/portable manifestations where relevant.
- FOIA Aggregator remains the authoritative collector of existing public released records; The Public Record provides the civic investigation/request layer.
- Engine Room sees verified PR and deployment progress rather than fabricated percentages.

### 1.5 Non-goals and hard prohibitions

- No bulk autonomous filing, requester impersonation, fabricated proof of receipt, false fee-waiver claims, deceptive bots or ways to bypass official submission controls.
- No automatic reuse of individual participant identity or email addresses across requests without explicit authorization.
- No platform claim that a FOIA request legally compels an agency to answer a question or create a new record.
- No accessing classified, nonpublic, credential-protected, or unlawfully obtained material, and no bypassing CAPTCHA, rate limits, access-control barriers or deliberately restricted portals.
- No automatic publication of personal contact details, third-party personal information, medical/financial data, or unreviewed sensitive records.
- No assumption that a missing online document was destroyed, illegally withheld, or ever existed.
- No guarantee of a particular FOIA outcome, turnaround time, fee level or appeal result.
- No procurement, expansion beyond free tiers, paid crawling or storage, or other spend without authorization.
- No attempt to duplicate FOIA Aggregator's bulk archival crawling or FOIA Bias Analysis's research conclusions inside this platform.
- No partisan quality filter: a lead may be investigated regardless of implicated administration/party, while editorial prioritization remains transparent and evidence-based.

---

## 2. Legal, provenance and public-trust requirements

### 2.1 FOIA basics implemented as software rules

- Federal FOIA, 5 U.S.C. sec. 552, generally governs **federal executive agencies**, not Congress, federal courts, state or local entities. A later state-records module must be explicitly jurisdiction-tagged and use different rules.
- A requester must reasonably describe **existing agency records**. The interface turns a public *question* into a request for identified records (e.g., logs, memoranda, contracts, correspondence), not a demand for an explanation.
- Individuals file their own requests. Official agency FOIA forms, email and procedures are authoritative for submission, including any extra identity verification required for certain categories of records.
- FOIA.gov's public developer API provides agency/component metadata and request-form descriptions. Its **agency-receiving API** is for government agencies accepting submissions from the government portal; do not assume it is a general third-party mass-submission API.
- The statutory 20-working-day requirement concerns an agency **determination**, not a guaranteed complete document production. Agencies can face backlogs and qualifying unusual circumstances; dates can be tolled or extended under applicable rules. Never label a case unlawfully overdue solely because 20 days elapsed.
- A requester's actual agency-received date may differ from when they clicked “I submitted.” The date algorithm must use evidenced agency receipt when known and carry an **unverified/approximate** label otherwise.
- Federal FOIA provides at least **90 calendar days** after an adverse determination for an administrative appeal, subject to agency-specific procedures. Always show the actual notice and official instructions; a generic deadline estimate is not legal advice.
- Agency-specific fee schedules and requester categories differ. A fee ceiling is a user-set amount, not a guarantee the requester will owe no money. No site-selected or fictional fee-waiver status.
- Requests for someone else's private records may require authorization, and first-party records require more careful handling. Do not solicit third-party sensitive files or suggest unsupported access rights.

**Maintain official legal references and recheck periodically:**
- https://www.foia.gov/how-to.html
- https://www.foia.gov/developer/
- https://www.foia.gov/swagger.html
- https://www.justice.gov/oip/freedom-information-act-5-usc-552
- https://www.justice.gov/oip/oip-guidance/oip-guidance-adjudicating-administrative-appeals-under-foia
- https://www.archives.gov/ogis/mediation-program/request-assistance

### 2.2 Evidentiary labeling (required)

Every public-facing claim must be categorized using evidence, not implication:

- **Question posed:** a question to investigate; no allegation proven.
- **Uncorroborated assertion:** attributable allegation or hypothesis, not platform-verified.
- **Source-supported:** documented by identified source(s), with conflicting sources preserved.
- **Agency-stated:** attributed official position, not automatically the final truth.
- **Document-confirmed:** exact released document and relevant passage establish a narrow factual proposition.
- **Disputed / uncertain / corrected:** editorial status with a visible history.

Every potentially missing record must likewise be labeled: `Referenced by source`, `Requested`, `Agency says no responsive records`, `Withheld under stated exemption`, `Referred/consulted`, `Expected but unverified`, `Released`, `Partial`, or `Unresolved`. Never convert suspicion into a confirmed withheld record.

A public record may be reviewed and republished only with provenance, appropriate rights, privacy checks, and user authorization. Keep originals and publication-safe derivatives separately.

### 2.3 Risk model

Treat participants as possibly vulnerable to doxxing, account compromise, harassment, legal confusion, retaliation or involuntary disclosure. Publication URLs and QR codes make sensitive content persistent. The privacy default must therefore be **private** unless the participant explicitly opts to share a specific public item, with an easily accessible preview and revocation/takedown process for material within our control. State plainly that official agencies may themselves disclose certain requester details through their own processes, outside the website's control.

---

## 3. Product information architecture

### 3.1 Public pages

1. `/public-record` — accessible homepage, core explainer, featured verified discoveries, browse and adoption entry points.
2. `/public-record/questions` and `/questions/:slug` — questions, evidence, ongoing investigation and links to records/requests.
3. `/public-record/investigations` and `/investigations/:slug` — source-backed investigation dossiers and record targets.
4. `/public-record/requests` and `/requests/:public_id` — curated available requests; published progress only.
5. `/public-record/agencies/:component_id` — vetted agency instructions, official destination and references.
6. `/public-record/records/:id` — released document card, citations, hash, sources, version and redaction/restriction labels.
7. `/public-record/redaction-gallery` — actual released redacted pages and explanation/citation.
8. `/public-record/missing-records` — gap ledger with explicit confidence and status labels.
9. `/public-record/silence-clock` — elapsed days, receipt confidence and lawful timing context.
10. `/public-record/public-receipts` — printable/shareable, privacy-reviewed document activity receipts.
11. `/public-record/one-citizen-one-question` — participant questions tied to investigations and requests.
12. `/public-record/read-the-record` — public reading packs/events and source passages.
13. `/public-record/document-hunts` — clue chains and cited documentary references.
14. `/public-record/walking-archive` — printable signs, QR cards, poster kits and source links.
15. `/public-record/methodology`, `/privacy`, `/safety`, `/corrections`, `/sources` — critical trust pages.

### 3.2 Signed-in participant pages

- `/me/public-record` — my adoptions, drafts, proof, correspondence, private documents, deadlines and participation history.
- `/me/public-record/drafts/:id` — personalized, version-pinned request preparation and download.
- `/me/public-record/requests/:id` — private timeline, upload, edit, appeal and share settings.
- `/me/public-record/publication/:id` — field-by-field consent, publish preview and withdrawal requests.
- `/me/public-record/settings` — privacy, optional notifications, account export and deletion workflows.

### 3.3 Protected editorial/admin pages

- `/admin/public-record` — role-scoped moderation, submissions, source review, unresolved gaps, deadline exceptions and operating health.
- `/admin/public-record/templates` — proposed, peer-reviewed, published and retired template versions.
- `/admin/public-record/agency-registry` — source freshness, official-form changes and manual verified overrides.
- `/admin/public-record/publication-queue` — private material review, redaction workflow and evidence approval.
- `/admin/public-record/audit` — security/admin changes, corrections and export records.

**UX tone:** purposeful, accessible, welcoming and credible. Not a threatening public blacklist, not a game of filing the highest number of requests. Evidence-forward design, large primary-source links, high-contrast status wording, mobile-first printable artifacts, no requirement for the visitor to understand FOIA jargon.

---

## 4. Detailed participant and operator journeys

### J1 — Discover an investigation

Visitor opens a public question, sees why it matters, what is known, what is alleged, who says what, the underlying citations, the specific records still being sought, and which requests might advance the investigation. The page first surfaces **existing FOIA Aggregator matches and already-published releases**. Discovery and browsing do not require login.

### J2 — Adopt and compose a request

User chooses a curated agency-specific request, creates/logs into an account if needed, and sees a clear instruction that **they will file it themselves**. The selected version is frozen for their draft. They confirm the target agency, record description and date range, add name/contact details locally or in their private account, set a fee ceiling, choose desired electronic delivery, and can optionally ask for a fee waiver only when they can truthfully support it. Generate accessible plaintext/PDF and agency-portal copy/paste content. Never alter requester identity or secretly submit.

### J3 — Self-file with an agency

Open the verified official portal/email instructions in a separate tab with a last-verified timestamp. The user personally files, then returns and marks `Submitted`, optionally supplying a local receipt, message ID, confirmation or screenshot. Platform status initially remains **user-reported submitted**; a reviewer or parsable receipt can elevate to **evidence-backed**. Do not assert agency receipt until a documented agency acknowledgement or other credible evidence exists.

### J4 — Monitor status and respond

Participant records the agency acknowledgement number, receipt date, clarifications, fee estimates, partial productions, referrals, exclusions, appeals and closure. Each event is time-stamped with its evidence origin; corrections are additive and recoverable. Deadline reminders explain their limitations. Silence Clock has a calendar-day clock and a separately labeled estimated statutory processing clock.

### J5 — Upload and share a response

Participant uploads response letter and released materials into **private quarantine**, where uploads are validated, malware-scanned and evaluated for obvious secrets, third-party personal details, minors, sensitive information, restricted content, and legal/publication concerns. The participant chooses public items and fields via explicit per-item grants; sensitive documents require staffed moderation. The published derivative has a visible source, date, evidence status, document hash and correction channel. Original private files never become public merely because a participant clicked “uploaded.”

### J6 — Learn from new evidence

The public record page connects the released files to questions, citations, gaps and the investigation timeline. Previously hypothesized missing records can be resolved, downgraded or contradicted. The Redaction Gallery and Missing-Records Wall link only to source-backed records and requests. New responsible FOIA requests can be prepared when gaps genuinely remain.

### J7 — Participate physically

Someone can print a Public Receipt, carry a Walking Archive QR card, read a reviewed passage at a public gathering, share one public question, or take part in a Document Hunt without revealing other participants' identities or using unsupported allegations. QR destinations must remain durable, accessible and correctable.

### J8 — Resolve mistakes or abuse

An affected person can report exposed personal data, false attribution, or an inaccurate claim. A moderator can immediately unpublish or restrict an item, preserve restricted accountability logs, notify relevant parties and publish an appropriate correction. Public caches, export feeds and distributed replicas are addressed according to actual revocation capabilities; never promise total recall of copied public material.

---

## 5. Feature requirements and acceptance semantics

### F01. Curated issue/question/investigation catalog

Structured question, matter, affected group, agency, chronological events, documentary leads, evidence, contested statements, official response and investigative next steps. All public conclusions must link to underlying citations. An investigation is never automatically marked government wrongdoing based on an allegation alone. Editors can update the conclusion without erasing the revision history.

### F02. Agency/component and filing-channel registry

Sync FOIA.gov agency/component metadata with provenance, ETag/cursor as supported, last-checked, form schema and destination URL; map parent agencies, component jurisdiction and retired aliases. Human review ensures current official destination; broken/unknown channels show warning and alternative official contact, not an invented submission portal. The public metadata API is not a public third-party filing service.

### F03. Prepared FOIA template library

Versioned, peer-reviewed templates with targeted records, date/location constraints, custodian/component, reasonable format, fee language, source justification and optional waiver rationale. Template status `draft -> in_review -> published -> superseded/withdrawn`. Preserve adopted version snapshots; template edits do not silently rewrite adopted drafts.

### F04. User-controlled drafting and self-filing

Editable download/copy output, recipient verification, clear “Submit on official site” link, participant confirmation, no hidden sending. Fee ceiling and requester category require explicit choices and plain-language explanation. The full request must be reviewable before filing.

### F05. Consent and participation management

Guest browsing; login required to persist adoption and private status. Public pseudonym/display name separate from legal requester identity. Do not promise anonymity to the government, which receives the real requester's filing information. Private profile fields remain inaccessible through public APIs, generated URLs, exports or analytics.

### F06. Request lifecycle and verification

Public display preserves `Unclaimed -> Adopted -> Submitted -> Acknowledged -> Released/Partial/Denied -> Appeal -> Archive`, while the internal model includes `draft`, `filed_unverified`, `receipt_verified`, `clarification_requested`, `fee_pending`, `extension`, `records_referred`, `rolling_release`, `no_records`, `closed`, `appeal_pending`, `reopened`, `archived`. These are **events and projections**, not a forced simple linear order. Track who asserted an event, evidence type, agency/source date and corrections.

### F07. Time tracking / Silence Clock

Show (a) time since user says they filed, (b) time since documented agency receipt, and (c) an **estimated** statutory working-day counter with weekend/federal holiday exclusions. Show pauses/extensions and uncertainty. A “no agency response recorded” label is not a legal finding of noncompliance. Appeal countdown starts from adverse-determination letter date when known, with agency-specific rules displayed.

### F08. Correspondence, fees, appeals and OGIS

Allow the participant to upload/record agency letters, fee estimates, fee-cap changes, scope clarifications, referrals, administrative appeal notices and outcomes. Offer reviewed templates for status inquiries/appeals but never autofile or claim legal representation. Link to FOIA Public Liaison, official appeal process and OGIS, and flag unresolved legal/timing uncertainty.

### F09. Secure release ingestion and publication

Private quarantined upload -> content/MIME validation -> antivirus scanning -> extraction and metadata -> PII/sensitivity review -> user-selectable share grants -> editor approval as applicable -> immutable original hash + public redacted derivative -> publish or withhold. An uploaded “no records” response is not a released record. Preserve release parts and agency correspondence separately.

### F10. Missing-Records Wall

Visually distinguish `mentioned by cited source`, `speculated`, `target of request`, `officially reported no records`, `withheld/partial`, `released`, `pending`. Link every slot to the primary source or explicit hypothesis. Avoid numerically counting speculative records as confirmed missing documents; counts show clear denominator and provenance.

### F11. Redaction Gallery

Display **actual agency-released** redacted pages with source, context, date, cited exemption if the agency provided one, accessible description and related adoptable request. A reviewer may label a redaction explanation absent from the **available response**, but not automatically unlawful. No fake redaction images masquerading as evidence. Support annotations separately from source material.

### F12. Public Receipt

Printable and web-accessible evidence card summarizing: question/request, agency, evidence-backed filing/receipt dates, records/pages **requested if knowable**, pages **released/withheld/redacted if supported**, elapsed calendar days, relevant source links and QR. Unknown counts stay unknown, not zero. Private details are removed by default; the requester controls attribution. Version the receipt when facts change.

### F13. One Citizen One Question

Each participant may publish a concise, civil public question and link it to an investigation, existing source, FOIA request or follow-up; the feature name is **not** a technical restriction limiting users to one question forever. Follow-ups update the answer/evidence record. Distinguish this Public Record action from the independently planned wider One Question platform; share identifiers/contracts when the latter becomes available.

### F14. Read the Record

Source-backed readings of verified documentary passages, optionally grouped into public events or downloadable reading packets. Include precise citations, readable excerpts, historical context, transcript/accessibility options and links to complete primary sources. No unreviewed anonymous claims presented as established readings.

### F15. Document Hunts

Evidence-focused scavenger hunts where people follow cited records, search references and identify what the cited documents do or do not establish. Reward source verification, corrections and useful references, **never mass filing, harassment or submission volume**. Each clue links to a permissible public source; progressive disclosure protects private user participation.

### F16. Walking Archive

Downloadable high-contrast, print-ready placards, QR pages, source cards and instructions for visitors to read the record directly. Clearly label the program and link to live, source-backed public pages; provide PDF and plain text. Physical conduct and permits remain the organizer's responsibility; the app must not generate a false official authorization.

### F17. Public transparency and dashboards

Search and filter by question, agency, topic, source, year, request stage and evidence strength. Publish verified aggregate counts only: questions, investigations, prepared requests, self-reported filings, verified receipt events, public responses, documents and resolved gaps. Separate unverified counts and consent-restricted cases; never count private uploads as public releases.

### F18. Notifications and accessibility

Opt-in notifications for milestones, requests for clarification, response uploads and timing estimates, with granular unsubscribe options. Email notifications should not put sensitive content in the subject/body; provide authenticated links. Accessible mobile interface and printable materials. Email integration and delivery provider must be configured explicitly; no claimed sending before successful test.

### F19. Public contributions, corrections and governance

Users can submit documentary leads, request better templates, suggest corrections and flag harmful or inaccurate releases. Contributions enter moderation, remain separately attributed internally and must not appear public automatically. Decisions are reviewable with appeals and an append-only restricted audit trail.

### F20. Responsible participation incentives

Positive feedback for successful evidence trails, high-quality source links, corrected claims, documentation reading and completed disclosure follow-up. Duplicate-request warnings based on matching template/agency/date/record scope; do not forbid legitimate separate requests. No competition or streaks rewarding filing quantities or deliberate agency burden.

---

## 6. Technical architecture and service boundaries

### 6.1 Proposed topology

```text
                     JUSTICE FOR ALL (public website / OIDC identity)
                                           |
                        The Public Record /public-record UI
                         Next.js + TypeScript / Render web
                              |                |
                      Protected API      Public read API
                              |
                     Neon PostgreSQL
                 (transactional source of truth)
                              |
                     Durable job/outbox table
                              |
              Bounded worker: scan / extract / redaction preview
                              |
      Private B2 quarantine -> restricted B2 originals -> public derivatives
                              |
              Publication adapter + source provenance
                              |
       FOIA Aggregator (read/search, approved crosslink or ingest contract)
                              |
             Released documents / independent public sources

  Optional future curated-public export -> Liberty Nodes (public only)
  Verified progress/health -> Engine Room (plan manifest and telemetry)
```

This is a **logical boundary diagram**, not a claim all integrations exist today.

### 6.2 Stack recommendation and portability

- **Web and application layer:** Next.js with TypeScript, standard React accessibility patterns, server-side validation and a typed domain/service layer. Select tested stable releases at implementation and commit a lockfile; do not chase unreviewed latest packages.
- **Transactional database:** Neon PostgreSQL; migration tool such as Drizzle with checked-in SQL migrations and downgrade/restore procedures. Unique constraints, database foreign keys and PostgreSQL row-level security or equivalent well-tested server permission guards for private data. Expose no privileged database credential to the browser.
- **Async work:** database-backed outbox/jobs with leased jobs, idempotency keys and a real configured scheduler/worker. A sleeping free Render service is **not** an always-on durable scheduler; mark automatic processing unavailable until a verified worker is deployed.
- **Document worker:** Python process/container only when it adds value for PDF extraction/OCR, malware scanning and validated redaction rendering. Never run unsafe embedded scripts/macros in attachments; isolate and limit CPU/memory/time/file size.
- **Objects:** private Backblaze B2 buckets/prefixes and restricted signed access. A separate credential and bucket or strict IAM boundary from FOIA Aggregator; do not write directly into the archive bucket using an unrestricted application key.
- **Search:** PostgreSQL full-text/trigram index for questions, metadata and public document citations; consume FOIA Aggregator search for its archive. A separate search cluster only if independently justified by load measurements.
- **Email:** opt-in transactional email provider via adapter; content-minimal alerts and verified deliverability when configured. No assumption that a Gmail or mail account is connected.
- **Hosting:** Render for web/API and approved workers; Neon for Postgres, B2 for objects. Provision in the correct named workspace after verifying permissions. Start low-cost; user must authorize any cost-bearing tier.
- **APIs:** OpenAPI 3.1 documented REST or typed RPC facade; version public contracts and preserve pagination, authorization, rate limits, idempotency and ETags.
- **Identity:** use Justice For All OIDC/SSO when available. Before upstream core exists, build a replaceable standards-based adapter with development-only test identities; do not launch a second incompatible production identity system.

### 6.3 Domain boundaries

The Public Record **owns** questions, investigations, campaign editorial workflows, request templates, volunteer adoptions, request and appeal state, publication grants, public receipts, the eight public actions and participation metrics.

FOIA Aggregator **owns** crawling, mass source inventory, original public release archive, full-text extraction for independently collected releases, source-level crawl status and canonical archive IDs. The Public Record requests search/link data through a stable versioned API or public integration export, not by connecting to FOIA Aggregator's SQLite database or modifying its B2 objects directly.

Justice For All Core **owns** universal site navigation, identity and cross-program member account, notifications primitives if implemented, platform-wide legal pages and common operator roles. The Public Record should work behind the core's identity API without assuming all core features are deployed now.

Liberty Nodes **may host public, rights-cleared, explicitly approved derivatives** with content-addressed integrity links. It must not receive quarantined files, private requests, receipts, personal identifiers or key material. Document that public replicas cannot necessarily be removed everywhere after publication.

Engine Room **owns** portfolio-status display. The Public Record supplies immutable PR-to-plan mapping and honest health/metric readings with observations and timestamps.

### 6.4 Integrations to build deliberately later

`Send_FOIA_Log_Requests` and `FOIA_Bias_Analysis` remain separate GitHub projects. FOIA Aggregator's current plan specifically prioritizes deep corpus expansion before materially advancing them. The Public Record may ultimately consume released-request-log metadata and evidence-based analysis, but must not quietly turn the first project's scripts into unconsented citizen mass filing or make partisan assertions from preliminary analyses.

---

## 7. Detailed data model and integrity constraints

### 7.1 Core entities

| Entity | Required fields/relationships |
|---|---|
| `external_identities` | OIDC subject ID, creation timestamps, locked/active state; private legal profile in separate protected table |
| `private_requester_profiles` | encrypted legal name/contact only when retained, consent version, retention class, owner subject |
| `questions` | stable public ID, text, status/evidence level, submitter/editor, canonical URL, revision |
| `investigations` | question references, public description, scope, stage, factual assertions, contradictory evidence |
| `claims` | narrowly worded claim, status, supporting/contradicting sources, reviewer, revision |
| `sources` | original URL, publisher, date, retrieved date, title, content digest if held, trust notes, rights |
| `evidence_links` | typed graph edge from source/document/passage to claim, question, gap or request |
| `agencies` / `agency_components` | official FOIA.gov entity ID, parent, official filing channel, sync timestamp, verification status |
| `request_templates` / `template_versions` | title, agency/component, targeted records, scope/dates, editable slots, fee defaults, approval state |
| `adoptions` | user, version, adopted timestamp, draft status, privacy scope |
| `request_instances` | immutable adoption/request ID, agency target, public/private visibility, user-owned filing state |
| `request_events` | append-only source-typed event, event date, recorded date, actor, evidence ID, correction-of ID |
| `proof_files` | private hashed receipt, upload owner, scan status, access policy, publicability false by default |
| `correspondence` / `fee_decisions` | participant-private agency letters, estimate/approval, fee ceiling and amended scope |
| `appeals` | source determination, official procedures, date, status, user-owned filing proof |
| `documents` / `document_versions` | original checksum, storage location, MIME, source, response link, scan/extract/publication status |
| `public_derivatives` | approved sanitized/redacted hash, authorized grant ID, approval and publication timestamp |
| `record_gaps` | cited expectation/status/confidence, relevant source and request, resolution/correction history |
| `redaction_annotations` | published document/page/location, exact source and reviewed explanatory metadata |
| `public_receipts` | versioned public snapshot of supported counts, public request ID, printable artifact key |
| `readings` / `document_hunts` / `walking_assets` | public primary-source links, approved content, print/download versions |
| `consent_grants` | item+scope+audience+version+actor+timestamp; revoke and effect log |
| `moderation_cases` | complaint, category, priority, limited viewer set, actions, status and notifications |
| `audit_events` | append-only restricted actor/action/target/time/result, never raw secrets or unnecessary PII |
| `outbox_jobs` / `integration_links` | job lease/retry/error, producer/event ID, external dataset/record ID and observed timestamp |

### 7.2 Partitioning and privacy

- Separate public projection schemas/views from participant-private tables. No endpoint can derive full private names from public IDs, hashed email lookup, error messages, search, SEO metadata, QR content or analytics events.
- `public_id` is an opaque random identifier; internal sequential IDs cannot reveal private request volumes or user relationships.
- External FOIA Aggregator IDs are distinct and namespaced from internal uploaded-document IDs. Avoid accidental collision.
- User legal contact information is not copied into public requests/receipts by default. Export only with field-level authorization.
- Encrypt sensitive private objects with authenticated encryption and scoped key authority according to E2EESA's applicable component profile. Do not claim E2EE for content that a backend OCR/redaction worker decrypts or that is intentionally published.
- Object key names must never contain email, requester's name, case allegation or other sensitive text; use random UUIDs/digests as applicable.
- Bind publication grants to **specific object version/hash + target audience**, not blanket approval of all future uploads.
- Append-only evidence audit and deletion/privacy obligations must coexist: redact/seal audit subject data while keeping permissible integrity metadata; use narrowly scoped retention, legal hold and deletion policies reviewed before release.

### 7.3 Request state machine

The top-level presentation labels are simple, but the internal request is an **event stream**:

```text
TEMPLATE AVAILABLE (Unclaimed)
       -> ADOPTED -> DRAFTED -> FILED_USER_REPORTED
       -> RECEIVED_EVIDENCED / ACKNOWLEDGED
       -> PROCESSING / CLARIFICATION / FEE / EXTENSION / REFERRAL
       -> INTERIM_RELEASE (zero or more) -> FINAL_RELEASE/PARTIAL/DENIED/NO_RECORDS
       -> APPEALED (optional) -> APPEAL_RESULT (optional)
       -> CLOSED / ARCHIVED
```

Transitions may overlap, and a case may be reopened or corrected. `Archived` means a preserved snapshot, **not** that no further release or appeal can occur. Implement projection rebuilds from the immutable event history; every displayed status has `asserted_by`, `observed_at`, `recorded_at`, `basis`, and `verification_level`. An agency denial is **not** a verdict on the underlying allegations.

### 7.4 Public versus private snapshots

Use separate materialized public views generated only after publication approval. Public API must not filter private rows client-side or embed private data in HTML/JSON hydration. Cache keys and search indexes must be visibility-partitioned. On withdrawn consent or emergency unpublish, revoke active signed URLs and invalidate caches; log inability to revoke external mirrors.

---

## 8. External and internal API contracts

Define schema-versioned APIs before implementation. Representative resource paths:

**Public GET:**
- `GET /api/v1/public-record/questions?status=&q=&cursor=`
- `GET /api/v1/public-record/investigations/:id`
- `GET /api/v1/public-record/agencies/:component_id`
- `GET /api/v1/public-record/templates/:public_id`
- `GET /api/v1/public-record/requests/:public_id`
- `GET /api/v1/public-record/records/:public_id`
- `GET /api/v1/public-record/gaps`, `/redactions`, `/receipts`, `/clocks`, `/hunts`, `/readings`, `/walking-assets`
- `GET /api/v1/public-record/metrics` — privacy-screened counts only

**Authenticated participant:**
- `POST /api/v1/me/public-record/adoptions` — requires template version and explicit intent; idempotency key
- `PATCH /api/v1/me/public-record/drafts/:id` — optimistic version and validation
- `POST /api/v1/me/public-record/requests/:id/events` — typed, attributed status event and proof refs
- `POST /api/v1/me/public-record/uploads/initiate` — private presigned staging upload with strict type/size bounds
- `POST /api/v1/me/public-record/publications/:id/consent` — explicit per-item grant after preview
- `DELETE /api/v1/me/public-record/publications/:id/consent` — revoke future platform publication and initiate takedown
- `POST /api/v1/me/public-record/corrections` and `GET /api/v1/me/public-record/export`

**Protected/editor:**
- `POST /api/v1/admin/public-record/templates/:id/review`
- `POST /api/v1/admin/public-record/agency-registry/sync`
- `POST /api/v1/admin/public-record/documents/:id/moderate`
- `POST /api/v1/admin/public-record/publications/:id/approve`
- `POST /api/v1/admin/public-record/corrections/:id/resolve`
- `GET /api/v1/admin/public-record/health` and scoped metric details

**FOIA Aggregator integration:**
- Versioned read-only search/record resolver using canonical archive IDs, SHA-256, original URL, agency component, publication date, source, text-index state and last observed timestamp.
- Later **approved** ingest/crosslink submission contract for independently submitted public releases; authenticated, idempotent and reviewed. The Public Record does not write directly to Aggregator's existing SQLite/B2 storage.

**Engineering requirements:** authorization on every private resource, paginated filtering, request/response validation, RFC-compliant errors, versioned schema, CSRF/session protections, ETags for updates, Idempotency-Key for mutations and replay-safe webhooks. OpenAPI examples may use synthetic fixtures only and must label them fake.

---

## 9. E2EESA adoption and specific security implementation

**Critical status:** E2EESA is an evolving specification; its GitHub README on October 10, 2026 says Audit v2 remediation toward `0.9.0-rc.2` is underway and the development tree is **not** a frozen production certification basis. Do not advertise “E2EESA-certified” merely because a checklist validates. Read `docs/AUDIT_REMEDIATION_PLAN.md`, the actual versioned profiles and the current release evidence before choosing crypto profiles.

### 9.1 Classify components and flows, not entire repositories

| Flow/component | Data | Required security posture |
|---|---|---|
| Public questions/released documents | intentionally public | integrity, source authenticity, HTTPS, moderation; **not** claimed E2EE |
| Participant login/session/profile | sensitive private | modern authenticated transport, encrypted storage, protected auth, least privilege |
| Private draft and proof vault | private | encrypt content and metadata where feasible, recipient-scoped access, event audit, data minimization |
| Person-to-person sensitive collaboration, if added | private interpersonal | **actual client-to-client E2EE** with well-defined identity and recovery guarantees; no server plaintext access claim if server can decrypt |
| Server-side scan/OCR/moderation | deliberately processed private content | explicit per-item processing authorization; trusted worker key scope, sandbox, retention, honest server-access disclosure |
| Official government FOIA form submission | outside platform | link to official channel; platform cannot promise E2E protection of the agency's service |
| Public export to Liberty Nodes | published content | exact hash/provenance/signature, explicit public-only allowlist, no private keys or drafts |
| Email alerts | potentially metadata-rich | subject/body minimization, unsubscribe and delivery-security controls; do not call ordinary email E2EE |

### 9.2 Threat model and mitigations

Mandatory threats: identity correlation through public cases, doxxing from PDFs/metadata, sensitive third-party disclosures, forged agency correspondence, private-object ID enumeration, malicious document payloads, SSRF in external URL imports, XSS/CSRF, SQL injection, broken object-level authorization, replayed status events, fake agency links, email spoofing, key exfiltration, clock manipulation, compromised volunteers/editors, mass-bot adoption, disinformation and public QR content substitution.

Mitigations: passkeys/MFA options for operators; authorization guards, signed per-object URLs with short expiry, strict content security policy, server-side MIME and magic-byte validation, malware scanning, isolated PDF rendering, limits on pixel/page size and decompression ratios, safe metadata stripping, immutable hash evidence, trusted agency-domain allowlist, human-verified filing destinations, double confirmation before publication, secret scanning, dependency/SBOM and container vulnerability scanning, signed releases, database and B2 access boundaries, structured security events, phishing-safe instructions, recovery drills and external review of threat controls.

**Key recovery:** use the current selected E2EESA profile and explicit client disclosure; never silently recover private material by granting the service previously unclaimed plaintext access. Key loss, device replacement, consent revocation and administrator compromise must have tested failure paths.

---

## 10. Data and integration workflows

### 10.1 Agency sync

Daily/weekly bounded FOIA.gov component metadata sync (based on verified provider limits) -> compare to existing record -> detect changed filing destination or form -> queue human verification -> preserve prior version and last-good official URL -> alert staff and mark templates stale if necessary. Never follow a suspicious agency-portal redirect to an unknown host without domain verification.

### 10.2 Existing-record search before new requests

Call FOIA Aggregator for agency/topic/time-source matches and show `Already available`, `Potential match`, `Known requested`, or `No matching indexed record located` with source coverage caveats. A failure of the Aggregator or an incomplete corpus **must not** be interpreted as proof records do not exist. Respect its extraction states and source coverage limits.

### 10.3 Publication and archive handoff

User-approved release -> malware/private-data review -> safe public derivative -> stable public document ID, hash, source, publication license/right notes and request link -> Public Record page -> optional approved normalized crosslink/ingest to FOIA Aggregator. Reprocessing duplicate uploads must be idempotent; same binary linked to different requests should not produce redundant bytes unless retention/scope requires separate originals.

### 10.4 Liberty Nodes

Publish only a reviewed manifest of stable public object hashes, title, citation, source, timestamp, rights and safe URLs. Revalidate before export; maintain omission list for rescinded publications; make irreversibility of third-party replication explicit before user first publication.

### 10.5 Engine Room

Check in `.exechub/project.yml` with **52 proposed work IDs** mapped to future actual PR numbers **only upon implementation evidence**. Expose signed or authenticated service health and the last run state: deployed SHA, schema version, public search readiness, agency-sync freshness, queue backlog, upload scan failures, publication queue status, verified backups, last recovery drill and uptime observations. Never turn missing credentials, 403, stale feeds or synthetic fixtures into green success or guessed percentages.

### 10.6 Inter-program links

Justice Teams can receive a **consented** referral to assist with an investigation or appeal. The Injustice Project can link a public testimony and a public-record question after editorial verification, without copying private witness identity. Witness Corps can submit primary-source evidence only through protected reviewed channels. One Question can reuse IDs for published questions, but remains an independent product. Public Witness can distribute Walking Archive and Read the Record kits. No private-user database sharing across modules without deliberate account and data-contract permissions.

---

## 11. Release stages and launch gates

| Release | User-visible scope | Exit requirement |
|---|---|---|
| `0.1 Foundation` | public skeleton; agency catalog; sample verified topics/questions | documented architecture; privacy isolation; honest status; tests passing |
| `0.2 Citizen Filing` | templates, adoption, user-owned draft, official-link filing, receipt capture | end-to-end participant flow for distinct agencies; no auto-submission |
| `0.3 Tracking` | correspondence, verification levels, clocks, fee/appeal timelines, reminders | event/rebuild accuracy, statutory-clock test fixtures and uncertain dates displayed |
| `0.4 Publication` | quarantined releases, source/citation linkage, redaction + human publication | malware/PII tests, consent and privacy gates, real reviewed test document |
| `0.5 Public Actions` | all eight actions and public dashboards | each feature works with source evidence, mobile/accessibility and print/QR tests |
| `0.9 Candidate` | external integrations, Engine Room, operational and security hardening | deployment/restore/pentest/a11y/pilot evidence and open blockers enumerated |
| `1.0 Production` | stable public site with managed operations | documented signoff against every P0/P1 acceptance criterion; actual service health |

A publicly viewable demo or successful GitHub merge **never implies** production readiness. The complete 52-work-package roadmap below specifies what another development agent should build.

---

## 12. PR-by-PR development roadmap (52 planned work packages)

**Numbering rule:** `TPR-01` etc. are **work-package IDs**, **not existing GitHub pull-request numbers**. A package can require one or multiple real PRs. Retain explicit mapping for Engine Room. Every PR must include tests, updated documentation, migration evidence if applicable, and a concise release note. Work in dependency order, merge only after required tests/reviews pass, and avoid unnecessary user approvals of routine engineering decisions. Never bypass permission, credential, legal/publication, spend or significant product gates.

### Phase A — Foundation, security boundaries, core data (TPR-01..10)

**TPR-01 — Repository, full plan, traceability register.** Create repo and check in this plan, approved-vs-recommended decision register, baseline status, contribution rules, P0 acceptance table and `.exechub/project.yml` proposed work IDs. **Acceptance:** independent checkout contains enough context to orient new developer; no fabricated merged progress.

**TPR-02 — Architecture decisions and external contract map.** Document service topology, per-system ownership, ADRs, data flows, object boundaries, FOIA Aggregator/Justice For All/Engine Room/Liberty Nodes contracts and temporary integration stubs. **Acceptance:** contract tests fail on incompatible schema; no direct cross-project database coupling.

**TPR-03 — E2EESA component classification and threat model.** Evidence-backed classification of every private/public path, applicable security profiles, recipient/key authority, data-exposure model, risk register and architecture review gate. **Acceptance:** no blanket ‘E2EE’ label for server-processed or intentionally public documents; security assertions tied to implemented controls.

**TPR-04 — API and domain schemas.** Define OpenAPI 3.1, request/event states, data classifications, consent shape, public/private projections, validation errors, pagination and idempotency. **Acceptance:** golden contract fixtures cover normal and forbidden transitions and PII exclusions.

**TPR-05 — Web/API monorepo bootstrap.** Next.js/TypeScript frontend, backend domain services, worker interface, lint/types/tests/build, development container, environment template and CI. **Acceptance:** fresh checkout boots with synthetic fixtures and no production secrets.

**TPR-06 — PostgreSQL schema and migrations.** Implement tables, constraints, indexes, private/public separation and seed data marked synthetic. **Acceptance:** clean and existing DB migration test, rollback/restore path, invalid relationships rejected.

**TPR-07 — Standards-based identity integration.** Justice For All OIDC adapter, test-only fake provider, session expiry and member profile boundaries. **Acceptance:** unauthorized requests fail; future provider swap works under contract test; test identities never ship to production.

**TPR-08 — Role-based authorization.** Visitor, requester, contributor, researcher, editor, records-reviewer, moderator, admin and operator scopes, with deny-by-default object-level checks. **Acceptance:** full matrix of cross-user access attempts returns no private data; roles cannot self-escalate.

**TPR-09 — Private object storage and encryption.** Isolated B2 buckets/prefixes and grants, encrypted objects, scoped signed uploads/downloads, content-type and size policy, storage cost stop. **Acceptance:** ID enumeration, expired token, forged key and wrong-user access tests fail closed; private object never has public URL.

**TPR-10 — Audit, privacy and publication event infrastructure.** Append-only audit events, consent-grant versioning, redaction/deletion request tracking, safe structured logs and immutable hash capture. **Acceptance:** every restricted action can be accounted for without embedding personal secrets in logs; deletion cannot silently rewrite the evidentiary timeline.

### Phase B — Research, sources, templates (TPR-11..18)

**TPR-11 — Agency/component registry sync.** FOIA.gov API adapter, pagination, verified component IDs, changing agency hierarchy, source-stamp, last-good cache and bounded retries. **Acceptance:** fixture sync handles stale, failed and renamed components with no mass deletion; sync coverage metrics honest.

**TPR-12 — Official filing route and form verification.** Reviewed official URLs, current forms, redirects, agency-specific instructions, date-checked changes, manual overrides and stale warnings. **Acceptance:** unknown/spoofed destinations blocked; two different real agency flow formats covered by QA.

**TPR-13 — Questions and investigation editorial CMS.** Evidence-level status, versioned claims, linked sources, source-backed chronology, contradictory evidence and publication workflow. **Acceptance:** a disputed source and a correction appear clearly, without erasing original version.

**TPR-14 — Citation graph and evidence provenance.** Typed source links, page/section citations, SHA-256 when source bytes retained, observed/published dates, original/derivative relationships. **Acceptance:** all published factual assertions can resolve source IDs and provenance; broken-link audit detects orphans.

**TPR-15 — FOIA Aggregator read-only resolver.** Search/query adapter to actual existing public API or agreed new interface, result provenance, archived-vs-indexed status, source coverage warnings and failure fallback. **Acceptance:** nonexistent/partial/blocked aggregator states never appear as ‘records don't exist’.

**TPR-16 — Duplicate and existing-record awareness.** Search existing releases and matching requests before promoting a new template/adoption; canonical agency/date/scope fingerprints and reviewer overrides. **Acceptance:** prospective duplicates warn but do not wrongly block legitimate distinct requests; no rewards for duplicates.

**TPR-17 — Reviewed FOIA template authoring.** Draft/review/publish/supersede template versions; placeholders for records, time range, agency and ordinary requester text. **Acceptance:** adopted template version remains unchanged after a curator updates the canonical template.

**TPR-18 — FOIA drafting lint and legal-information copy.** Checks that output seeks records, is scoped, selects verified component, truthfully presents fee/requester options and electronic format; legal notices and official links. **Acceptance:** invalid, overbroad, misaddressed or unsupported waiver language is flagged before export; override reason logged where legitimate.

### Phase C — Citizen filing and case progression (TPR-19..27)

**TPR-19 — Adoption and member dashboard.** Unclaimed/adopted work cards, user-owned adoption, private saved drafts and secure history. **Acceptance:** anonymous browse works; only owner sees draft or legal identity.

**TPR-20 — Personalized request compose/export.** Accessible copy text, PDF and download, fee ceiling and conditional waiver language, title/version provenance. **Acceptance:** sample outputs correctly address distinct agencies and match pinned templates, with zero hidden submission requests.

**TPR-21 — Official self-filing guide.** Agency-specific hand-holding, current portal/email instructions, acknowledgement guidance, user-facing “file it yourself” confirmation. **Acceptance:** no outbound auto-submission; redirects only to independently verified official domains.

**TPR-22 — Submitted proof and receipt verification.** Accept participant-reported filing, optional private proof, agency case number, clear confirmation-level labels and tamper detection. **Acceptance:** fabricated/unverified user event never appears ‘agency-confirmed’; proof privacy tests pass.

**TPR-23 — Request lifecycle event engine.** Add typed events, causal relationships, corrections, partial productions, appeals and projection rebuilds. **Acceptance:** out-of-order/repeated/conflicting event fixtures are handled without corrupting timelines; correction shown in history.

**TPR-24 — Federal working-day and appeal-clock engine.** Weekend/holiday calculation, receipt uncertainty, allowed tolling, unusual-circumstance notices, extensions and 90+-day administrative-appeal notice tracking. **Acceptance:** legal test matrix covers holidays, unknown received date, extensions, fee pause and disputed outcomes; no categorical ‘illegal delay’ from timer alone.

**TPR-25 — Notification and job outbox.** Consent-based transactional updates, authenticated secure links, unsubscribe, retry/dead-letter, bounded worker leases. **Acceptance:** test mail delivery, duplicate suppression, invalid provider credential and offline worker; no claim of real email before live test.

**TPR-26 — Correspondence, fee and scope revisions.** Private agency letters, fee estimates, user fee cap updates, clarifications/referrals and official provenance. **Acceptance:** user decisions never silently authorize an above-cap payment; personal data hidden from public views.

**TPR-27 — Appeal and OGIS assistance workflow.** Explain possible administrative appeals, agency-specific official instructions, linked adverse determinations, user-drafted appeal letters, OGIS resources and tracking. **Acceptance:** no auto-filing or false deadline certainty; timeline preserves original denial and later appeal result.

### Phase D — Safe documentary publication (TPR-28..32)

**TPR-28 — Private upload quarantine.** Chunked/presigned upload, size/MIME validation, SHA hashing, malware scanning, timeouts, safe parser sandbox, reject active/malicious files. **Acceptance:** infected, misdeclared, oversize and zip-bomb fixtures cannot reach public storage or downstream preview.

**TPR-29 — Record extraction and correspondence classification.** Bounded PDF/text/image extraction, OCR when installed, page counts and metadata extraction, linked request and source, failure states. **Acceptance:** scanned/native/mixed/empty/unsupported documents remain individually classified; failure never marks a record as publicly searchable.

**TPR-30 — Privacy screening and redacted derivative review.** PII assistive detection, human QC, metadata stripping, irreversible redaction rendering, source/derivative hash chain and sensitivity review. **Acceptance:** text extraction and copy/paste cannot recover redacted content; scanner positives require approval before publishing.

**TPR-31 — Explicit publication authorization and correction.** Per-document/version/field sharing, preview, separate editor approval, public materialized views, cache purge and takedown. **Acceptance:** withdrawn consent blocks future platform delivery, unapproved originals never appear in search, privacy tests enumerate all public surfaces.

**TPR-32 — Public archive bridge and provenance.** Public document pages, stable citations, crosslinks/approved ingest adapter to FOIA Aggregator, idempotent hash referencing, release-vs-correspondence semantics. **Acceptance:** provenance survives missing external service, duplicate public releases and source-page edits.

### Phase E — Eight approved public actions (TPR-33..40)

**TPR-33 — Missing-Records Wall.** Evidence-ranked visual gap catalog and record-resolution transitions, source links and filterable status categories. **Acceptance:** hypothetical entries remain explicitly speculative; no missing count includes unverified records without a separate label.

**TPR-34 — Redaction Gallery.** Visually accessible released-page viewer, agency exemption annotation where stated, request links, source-backed context. **Acceptance:** only genuine released redactions enter gallery; annotations do not appear in the original document and are reviewable.

**TPR-35 — Public Receipt cards.** Supported counts/dates, verification badge in ordinary text, publication-safe attribution choices, accessible printable PDF and QR. **Acceptance:** unknown pages stay unknown; QR points to current corrected evidence, no private name accidentally printed.

**TPR-36 — Silence Clock public exhibit.** Separate total elapsed days, agency-receipt timer, estimated statutory working days and explanation of extensions/tolling. **Acceptance:** clock stops/updates appropriately; no automated legal wrongdoing determination, stale feeds identified.

**TPR-37 — One Citizen One Question.** Plain-language question submission, investigation linkage, answer sourcing, public follow-up and independent One Question contract placeholder. **Acceptance:** question with no answer is labeled unanswered, not agency violation; abusive personal targeting moderated.

**TPR-38 — Read the Record program.** Public excerpt pages, reading packets, optional gatherings, primary-document citations, captions/transcript and print. **Acceptance:** packet references exact versioned source; accessibility checks and source integrity pass.

**TPR-39 — Document Hunts.** Evidence-focused interactive clue trails, research achievements, source fidelity and abuse-safe scoring. **Acceptance:** completed hunts require correct source navigation, not request spam; bad links and misattributions detected.

**TPR-40 — Walking Archive.** Printable signs/placards/folders, stable QR source URLs, safe public sharing templates and accessibility. **Acceptance:** mobile scan and printed black-and-white QR work, outdated material displays corrections, no private data in assets.

### Phase F — Unified public surface, integrations, governance (TPR-41..46)

**TPR-41 — Public search, browse and truthful aggregate metrics.** Questions, investigations, approved files, response status and agency/timeline filters, SEO and accessibility. **Acceptance:** privacy-separated queries, no fabricated coverage figures, source freshness labels, stable pagination.

**TPR-42 — Responsible participation and public-facing campaign experience.** Cohesive homepage, campaign landing pages, source-based contribution recognition, redundant filing guardrails, opt-in updates. **Acceptance:** rewards never increase with raw filing counts; usability test demonstrates new user understands self-filing and privacy.

**TPR-43 — Liberty Nodes public-only export adapter.** Versioned signed/public manifests, content hashes, public-only allowlist, replication/revocation limitations disclosed, feature flag until Liberty Nodes supports contract. **Acceptance:** malicious private reference in export is rejected; offline/no-nodes state works without misleading claims.

**TPR-44 — Justice For All Core integration.** Shared routes, site navigation, OIDC identity/roles, design system and cross-program permissioned links to Injustice Archive, Justice Teams, One Question and Witness Corps. **Acceptance:** single sign-on works when available; no private data leaks between projects; isolation mode remains tested.

**TPR-45 — Engine Room status and PR evidence connector.** Approved work manifest, real PR-ID mapping, release/health observations, timestamps, blockers, backup and agency-sync metrics. **Acceptance:** missing telemetry says unverified; mock/failed CI cannot appear as completed progress.

**TPR-46 — Moderation, corrections, research transparency and anti-abuse.** Public reports, urgent takedowns, correction log, appeal of moderation, source provenance policy, legal escalation, rate limit and human review. **Acceptance:** disclosure/doxxing drill removes public access rapidly and logs next steps; abusive submissions cannot bypass controls.

### Phase G — Verification, operations and production (TPR-47..52)

**TPR-47 — Security assessment and E2EESA evidence.** Complete current component-level profile conformance assessment, negative auth/crypto/storage tests, SAST/DAST, secret scan, dependency/SBOM, external pen-test scope and findings. **Acceptance:** all critical/high issues remediated or production blocked; no unearned independent certification claim.

**TPR-48 — Accessibility, responsive and real-user usability.** WCAG 2.2 AA target, keyboard/screen-reader, mobile, reduced motion, color contrast, 200% zoom, form errors, PDFs, QR alternatives; novice user study. **Acceptance:** automated and manual a11y tests plus at least five consented scenario users demonstrate successful self-file guidance without confusion.

**TPR-49 — Performance, data integrity and workload testing.** Query/index benchmarks, concurrent sessions, file processing exhaustion, clock replay, event idempotence, big uploads, outage simulation and backpressure. **Acceptance:** measured SLO targets in section 13 and no privacy cross-talk under stress.

**TPR-50 — Operations: backups, restoration, scheduler and alerts.** Neon restore evidence, B2 object recovery, version/retention controls, staged secrets rotation, cost limits, dashboard, signed-health observation and persistent worker verification. **Acceptance:** timed full disaster-recovery rehearsal and recovery checksums, alerts triggered on deliberately failed import/scan/backup.

**TPR-51 — Staging deployment and production rehearsal.** Render services, Neon migrations, B2 bucket policy, domain/TLS, CI/CD, preview vs production protection, rollout/rollback and synthetic-to-real data boundary. **Acceptance:** integration smoke tests after actual deployment, staged and production credentials separated, rollback proven on staging.

**TPR-52 — Controlled public pilot, remediation, production acceptance.** Pilot across at least two differently configured federal agency workflows, original documents reviewed with appropriate rights, independent participant privacy review, help materials, incident playbooks, accessibility and security signoff. **Acceptance:** all P0/P1 gates pass with evidence, remaining limitations published, Engine Room reports real deployment and registered PR progress, not implied completion.

---

## 13. Quality assurance, acceptance suite and measurable outcomes

### 13.1 Mandatory testing layers

1. **Unit:** deterministic federal calendar; status transitions; template slot substitution; public vs private projection; evidence status; JSON validation; idempotency.
2. **Contract:** FOIA.gov metadata fixture drift; Aggregator search result schema; Justice For All SSO claims; Engine Room status payload; Liberty Nodes export manifest.
3. **Integration:** Neon migrations/rollback; B2 signed upload; scanner; OCR; link validation; consent grant; SQL privilege scoping; background job lease/replay.
4. **Browser end-to-end:** visitor to question to template; citizen adopt/export/self-report receipt; agency response and review; publication and revoke; eight public actions; screen-reader and mobile flows.
5. **Adversarial/security:** cross-account data leaks, object-ID guessing, XSS/CSRF, malicious upload, forged agency redirect, status-event forgery, signing/encryption errors, revoked links, stale permission tokens, bulk scraping of private info.
6. **Legal-semantic fixtures:** 20 working days vs calendar days, weekends, federal holidays, unknown receipt, adverse determination, extended response, valid appeal windows, fee dispute and partial releases.
7. **Resilience:** queue restart, duplicate event, offline Aggregator, expired API key, agency data changes, Render sleeping, Neon transient failure, B2 quota stop, failed OCR, recovery from validated backup.
8. **Editorial checks:** every illustrative case is explicitly synthetic, every public claim has review state, every public release has original source and derived-publication authorization.

### 13.2 Proposed engineering performance gates (targets, not current measurements)

- P95 public page server response under **1.5 s** and search API under **2 s** at a **documented representative load**, excluding uncontrolled upstream latency; measure on staging and publish test workload.
- No mixed private/public search index results; authorization and scope checked for **100%** of private API paths in security inventory.
- Within **10 minutes under a healthy worker**, a typical 25 MB-or-smaller upload is scanned and enters review or an explicit failure state, not silently marked published. Heavy OCR and production backlog require visible separate limits.
- Availability target **99.5% monthly** only once an always-on production tier/monitoring can actually support it; free sleeping service is not claimed to meet the target.
- Backup target **RPO <=24 hours, RTO <=4 hours** after production recovery design is approved, with actual rehearsal proving or revising them; do not claim achievement based on configuring a backup toggle.
- Every released public derivative must have an original hash and provenance link; each public receipt must calculate counts from verified data, not estimates without labels.
- **Zero known critical/high security blockers** at production signoff, with review evidence. Automated scanners alone are insufficient.

### 13.3 Pilot data and editorial acceptance

Use synthetic data in CI and staging. Live pilot requires actual volunteer-authorized filings, verified official agency links, real acknowledgement or explicit unverified flag, safe submitted responses, and at least one tested “no responsive records”/partial/denial scenario (real or visibly simulated for UI if no live case exists). Do not fabricate a real agency reply to satisfy a demo. Publish a methodology page and known gaps including FOIA Aggregator corpus limitations.

---

## 14. Data governance, user rights, ethics and accessibility

### 14.1 Participant controls

- Private by default for name, legal address, phone/email, adoption identity, agency tracking numbers if they can correlate to a user, receipts and raw uploads.
- For public credit, users choose no credit / pseudonym / identified credit independently from the required legal identity disclosed to the agency.
- Explicit per-item consent for public original, derivative, public receipt, public attribution and external decentralized replication (separate high-friction confirmation).
- Participants can download their own case history and request private data deletion, subject to clearly described lawful/operational retention limits; public source records may have independent legitimate archive provenance.
- Public correction and emergency takedown path visible on every published item.
- No sale/advertising-based targeting of sensitive activist/participant data. No tracker that discloses case interest to unaffiliated ad providers.

### 14.2 Moderation and editorial policy

- Require citations or clearly mark hypotheses in public investigations; preserve original disagreement/retractions.
- Do not publish unreviewed accusations of crime or misconduct as findings.
- Remove doxxing, threats, impersonation, instructions to harass, illegally acquired secrets, exposed private medical information and misattributed government documents.
- Protect lawful criticism and documentary investigation; moderation is evidence/safety-based with a case log and appeal route.
- No platform facilitation of unlawful access or coercion; no false agency affiliation.
- Publication rights, fair-use/source links and third-party terms reviewed for public mirrors.

### 14.3 Accessibility and plain-language design

A first-time user must understand the service and accomplish a legitimate self-filing workflow in ordinary language. Explain “request”, “acknowledgement”, “determination”, “release”, “appeal”, “redaction”, “fee waiver” with short accessible glossaries. All public exhibit content must have a non-visual equivalent, including clocks, walls and graphics. Printed/QR assets link to accessible web equivalents.

---

## 15. Deployment, operations and cost controls

### 15.1 Environments and secrets

- `local`: fully synthetic data, fake email/OIDC, local/mock object store, no government submissions, safe testing fixtures.
- `staging`: separate Neon branch/project and separate B2 staging space; fake users or explicit pilot consent; no accidental public cache.
- `production`: reviewed Neon branch/project, independent B2 application keys, verified Render service and domain. Production permission/credential configuration is a named checklist step, **not** an assumption from the plan.
- Configure env variables for database pooled/unpooled, OIDC issuer/client, B2 endpoint/bucket credentials, upload signing keys, email provider, FOIA.gov API key, aggregator base URL/credential where required, worker leases, monitoring and encryption/key service. Keep names and scopes in `.env.example`; never commit actual values.

### 15.2 Worker and schedules

External scheduling must be real and authenticated. Background work uses durable outbox leases and a persistent or verified scheduled worker; `next_run_at` inside PostgreSQL does not execute itself. Scheduled actions are agency-registry refresh, safe notification delivery, scan/extraction retries, broken-link sampling, publication integrity checks, Engine Room health updates and backup integrity drills. Only enable queues when their worker and credentials are verified.

### 15.3 Operational monitoring

Health endpoint checks app build, DB connectivity and migration; readiness additionally checks mandatory crypto/object/worker dependencies for the deployed role. Operational telemetry separately reports agency-sync last success, aggregate users/actions under privacy thresholds, drafts/adoptions, verified vs user-reported submissions, public releases, scan failures, inbox/outbox backlog, B2 usage and last verified restore. An endpoint that responds `200` alone is **not** proof of functioning release review or email delivery.

### 15.4 Cost and capacity

Use free/low-cost tiers while feasible and guardrail-controlled. Project storage and compute by bytes, scan/OCR CPU minutes, B2 object versioning and egress, Neon capacity and email volume. The existing FOIA Aggregator has its own B2 storage ceiling and Class B quota considerations; **do not** conflate or drain its free storage with Public Record private uploads. When capacity approaches a cap, stop nonessential ingestion gracefully, keep core reads operational and surface a prominent real operations blocker. Explicitly ask for authorization before paid upgrades.

### 15.5 Backups and breach response

Daily or risk-adjusted relational backups, isolated B2 object retention, encrypted sensitive-data key backups and tested point-in-time/restore procedures. Database snapshot without objects is not a full restore, nor are B2 objects useful without their linking metadata and grants. Measure restore integrity through end-to-end checks of approved public files and private permissions. Incident runbooks for malicious uploads, leaked private records, compromised agency destination, corrupted public manifest, identity provider failure, revoked key, lost participant device and takedown of exported material.

---

## 16. Dependency ordering, interface freeze and execution instructions

### 16.1 Critical path

1. Confirm repository state, check in this entire handoff file, establish `TPR-01..52` register and assign genuine PR numbers only as work merges.
2. Confirm current E2EESA applicability/spec version and build private/public data boundaries before handling real users or files.
3. Complete API, schema, identity abstraction, agency registry, question/investigation CMS and FOIA Aggregator **read-only** integration.
4. Build template adoption and **self-filing** before public mass-action promotion.
5. Build event accuracy and private documents; only then introduce public response and gap features.
6. Publish all eight public actions after evidence/consent/missing-record status safeguards pass.
7. Connect to Justice For All Core, Liberty Nodes when safe/ready, and Engine Room for status; verify integrations rather than assuming them.
8. Finish risk review, recovery, measured accessibility/performance, real pilot and release signoff.

**Parallelization:** Agency sync, investigative editorial UI and initial Aggregator read-only contract can proceed after foundational schema; PDF processing can be implemented behind feature flags while request lifecycle progresses; print/QR assets can be built in parallel *after* source and publication contracts are stable. Do not merge dependent API consumers before their contract fixtures pass.

### 16.2 Exact relationship to FOIA Aggregator expansion priority

FOIA Aggregator's October 10, 2026 development plan identifies its own approved ten-unit roadmap plus fourteen additional corpus-expansion units. The aggregator must continue toward much deeper official and third-party released-record coverage before its **FOIA Bias Analysis** and **Send FOIA Log Requests** dependents are materially advanced. This **does not prevent** The Public Record's independent template, volunteer self-filing and case-tracking features from being developed now. It does require the Public Record to display corpus limits candidly and avoid treating a search miss as an absence of available records.

### 16.3 Merge/deploy automation rules

- Agent may open/chain routine PRs, run linters/tests/build/contract suites, review diff and merge clean green PRs according to repository protection rules and user's standing authorization. Do not need user to decide routine implementation choices.
- Stop/ask only for unavailable credentials, a genuine product-policy/legal publication issue, a purchase/paid tier, unresolved cross-repo security decisions, a failed mandatory protection gate or a blocking conflict outside safe repair.
- Do not paper over red tests, change expected results to hide failures, disable security tests, silently amend the security standard, force-push protected branches or mark broken deployments healthy.
- Verify migration/rollback and correct Render/Neon/B2 workspace before deploy. Report whether *code merged*, *service deployed*, *feature configured*, *live tested* and *production accepted* distinctly.
- All documentation and status must reflect actual checked commits and test runs, not approximate memory.

---

## 17. Repository handoff file manifest

Require these committed files before accepting the repository as independently executable:

```text
README.md                        (mission, current truthful state, quick start)
LICENSE                          (approved legal/license choice)
.env.example                     (names only, no keys)
.exechub/project.yml             (52 planned work IDs, real mapping as evidenced)
.github/workflows/ci.yml         (lint/type/unit/integration/security gates)
apps/web/                        (public site, participant and protected operator UI)
packages/domain/                 (event model, data classification, validation)
packages/contracts/              (OpenAPI schemas, adapter version contracts)
packages/ui/                     (shared accessible interface, if upstream available)
workers/documents/               (isolation, scan, extract, sanitize, job handling)
db/migrations/                   (reviewed reversible migration history)
tests/fixtures/                  (fictional agencies/requests and harmless files)
tests/e2e/                       (self-filing, status, publication, printed exhibits)
docs/DEVELOPMENT_PLAN.md         (this full document; not a partial summary)
docs/REQUIREMENTS_MATRIX.md      (feature -> TPR ID -> tests -> release evidence)
docs/APPROVED_DECISIONS.md       (approved choices vs recommendations)
docs/ARCHITECTURE.md             (runtime/identity/object/data-flow diagrams)
docs/ADR/                        (dated changes and reasons)
docs/SCHEMA.md                   (ERD, retention and public/private projections)
docs/API.md                      (OpenAPI routes, examples, auth)
docs/INTEGRATIONS.md             (FOIA.gov, Aggregator, JFA, Liberty, Engine Room)
docs/FOIA_LEGAL_RULES.md         (official-source links, dates, rule boundaries)
docs/E2EESA_APPLICABILITY.md     (component/flow profile inventory + evidence)
docs/THREAT_MODEL.md             (risks, mitigations, test evidence)
docs/PUBLICATION_POLICY.md       (review, rights, consent, takedown, citations)
docs/OPERATIONS.md               (worker/sync/status/recovery/alert procedures)
docs/DEPLOYMENT.md               (Render/Neon/B2 staging and production)
docs/ACCEPTANCE_EVIDENCE.md      (actual test results, links, unresolved gates)
docs/OPEN_BLOCKERS.md            (precise external requirements only)
```

If another account receives only the repository, it must be able to identify the next **uncompleted** work package, inspect acceptance criteria, run tests, see deployment targets and know which credentials are missing without access to this conversation.

---

## 18. Launch definition of done

The Public Record is not complete until **all** of the following are independently evidenced:

- A member can locate a verified question, search known public releases, adopt a prepared request, verify agency destination, customize fee terms, generate accurate filing text and self-file through an official channel.
- Member can independently report submission, supply proof, track acknowledgement, manage private correspondence, understand timing and appeal information and choose granular publication.
- Actual safe source-backed public responses can be published with reviewed redactions, exact provenance and correct crosslinks to FOIA Aggregator, and private originals cannot leak via public UI, QR, search, analytics, caches or exports.
- Redaction Gallery, Missing-Records Wall, Silence Clock, Public Receipt, One Citizen One Question, Read the Record, Document Hunts and Walking Archive are implemented, source-backed and accessible.
- Different-status, conflicting-evidence, missing-record and no-records scenarios are correctly represented without defamatory overclaiming or false FOIA legal guarantees.
- E2EESA applicability, security controls, privacy permissions, editor workflows, accessibility and restoration are validated with evidence appropriate to this deployment; no misleading E2EE certification claim.
- Real Render/Neon/B2 services and any background worker are configured and tested; no keys committed; cost limits enforced; no paid upgrade without approval.
- Engine Room shows this project, all 52 work packages, actual mapped PR merges, real deploy health, known blockers and evidence timestamps. Unverified observations remain unverified.
- Independent account receives the committed documents, repeatable setup, CI, deployment runbooks, current blockers and real acceptance evidence. It can continue without user memory.

**This plan is comprehensive and implementable; it is not a representation that these items are already developed, deployed or legally reviewed.**

---

## 19. Official primary sources and existing code (as checked October 10, 2026)

- FOIA.gov — How to Make a Request: https://www.foia.gov/how-to.html
- FOIA.gov — Developer Resources / agency component API: https://www.foia.gov/developer/
- FOIA.gov — Portal API reference: https://www.foia.gov/swagger.html
- DOJ OIP — FOIA statute: https://www.justice.gov/oip/freedom-information-act-5-usc-552
- DOJ OIP — Administrative appeals: https://www.justice.gov/oip/oip-guidance/oip-guidance-adjudicating-administrative-appeals-under-foia
- DOJ OIP — FOIA & Privacy Act interface: https://www.justice.gov/oip/oip-guidance/oip-guidance-interface-between-foia-and-privacy-act
- NARA OGIS — dispute resolution: https://www.archives.gov/ogis/mediation-program/request-assistance
- FOIA Aggregator source and complete handoff: https://github.com/neophilism/FOIA_Aggregator and `docs/DEVELOPMENT_PLAN.md`
- E2EESA standard and corrected remediation plan: https://github.com/neophilism/End-To-End-Everywhere-Security-Architecture-Standard and `docs/AUDIT_REMEDIATION_PLAN.md`
- Engine Room implementation/integration: https://github.com/neophilism/Engine-Room and `docs/live-project-integration.md`
- Send FOIA Log Requests: https://github.com/neophilism/Send_FOIA_Log_Requests (README checked; do not presume a deployed service)
- FOIA Bias Analysis: https://github.com/neophilism/FOIA_Bias_Analysis

**Freshness instruction:** Review current official pages, current GitHub heads, current data coverage and external provider contracts when work begins; this date is a planning baseline, not a perpetual guarantee.

---

## Appendix A. Requirements-to-work-package traceability

These mappings are expected owners, not evidence of implementation. A new account should update `docs/REQUIREMENTS_MATRIX.md` with the actual merged PR SHA and test evidence for every row.

| Requirement | Primary TPR package(s) | Required release evidence |
|---|---|---|
| F01 Questions and investigations | 13, 14, 41 | source-backed claim and correction browser test |
| F02 Agency registry | 11, 12 | live verified agency flows and metadata drift fixture |
| F03 FOIA templates | 17, 18 | frozen version and template editorial approval |
| F04 Self-filing and request text | 19, 20, 21 | no auto-submission; distinct official channels |
| F05 Consent and participant identity | 7, 8, 10, 31 | role/consent and anonymity-boundary tests |
| F06 Request lifecycle | 22, 23 | acknowledged/partial/appeal/correction projection test |
| F07 Silence Clock rules | 24, 36 | legal-semantic calendar and uncertain-date fixtures |
| F08 Fees, letters and appeals | 26, 27 | fee-ceiling and official-appeal scenario |
| F09 Secure uploads/publication | 9, 28, 29, 30, 31, 32 | clean/malicious upload and explicit release grant |
| F10 Missing-Records Wall | 33 | evidence level never escalates without source |
| F11 Redaction Gallery | 34 | genuine release, source/citation and annotation separation |
| F12 Public Receipt | 35 | unknown vs zero and no private attribution |
| F13 One Citizen One Question | 37 | public question/evidence state and correction |
| F14 Read the Record | 38 | public source passage and accessible reading pack |
| F15 Document Hunts | 39 | valid document clue, no filing-volume rewards |
| F16 Walking Archive | 40 | printable QR and accessibility test |
| F17 Public analytics/search | 41, 45 | verified counts and privacy-safe API results |
| F18 Reminders and accessibility | 25, 48 | actual opt-in mail and user-agent accessibility |
| F19 Public contributions/corrections | 13, 14, 46 | moderation workflow and immutable revision ledger |
| F20 Healthy incentives | 16, 39, 42, 46 | duplicate warnings without blocking legitimate filings |
| Portfolio/security/operations | 43–52 | health, integrations, audited privacy, restore and pilot |

## Appendix B. Suggested operational environment contract (names only)

The following is a recommended `.env.example` list and must be edited to match the actual deployed providers; **no value here is a real credential**:

```dotenv
NODE_ENV=development
PUBLIC_BASE_URL=http://localhost:3000
DATABASE_URL=
DATABASE_URL_UNPOOLED=
OIDC_ISSUER_URL=
OIDC_CLIENT_ID=
OIDC_CLIENT_SECRET=
OIDC_REDIRECT_URI=
SESSION_ENCRYPTION_KEY=
B2_ENDPOINT_URL=
B2_REGION=
B2_QUARANTINE_BUCKET=
B2_RESTRICTED_BUCKET=
B2_PUBLIC_DERIVATIVE_BUCKET=
B2_KEY_ID=
B2_APPLICATION_KEY=
ENCRYPTION_KEY_PROVIDER=
KEY_MANAGEMENT_KEY_ID=
FOIA_GOV_API_KEY=
FOIA_AGGREGATOR_BASE_URL=
FOIA_AGGREGATOR_API_TOKEN=
JUSTICE_FOR_ALL_BASE_URL=
LIBERTY_NODES_EXPORT_ENABLED=false
LIBERTY_NODES_ENDPOINT=
ENGINE_ROOM_INGEST_URL=
ENGINE_ROOM_TELEMETRY_TOKEN=
EMAIL_PROVIDER=
EMAIL_API_KEY=
EMAIL_FROM_ADDRESS=
JOB_WORKER_ENABLED=false
JOB_WORKER_LEASE_SECONDS=120
MAX_PRIVATE_UPLOAD_BYTES=26214400
STORAGE_BUDGET_BYTES=
AUDIT_LOG_RETENTION_POLICY_ID=
PRIVATE_OBJECT_RETENTION_POLICY_ID=
PUBLICATION_POLICY_VERSION=
```

At startup validate required variables for the specific process role; do not require a FOIA Aggregator token when a documented public read endpoint suffices. Operator-only secrets go in Render/Neon/B2 secret stores, never in frontend-exposed `NEXT_PUBLIC_*` environment values. A blank or undeployed external integration must be visibly `not configured` rather than silently replaced with invented example data.

## Appendix C. Explicit end-to-end acceptance scenarios

These scenarios should be converted into executable browser, API and job-level test fixtures. All fictional data must display a **test-only** label and must never populate public production statistics.

**SC-01 — First visitor:** Open the homepage unauthenticated, browse a question, see actual source links and find a related public FOIA Aggregator record with correct metadata; no account prompt until adoption.

**SC-02 — Self-file:** Registered individual adopts an approved request to one agency, sets a fee cap, verifies official destination, copies text, files outside the site, returns and reports submission. Database shows `filed_user_reported`, not `received_evidenced`, until receipt evidence exists.

**SC-03 — Agency moved its portal:** Cached URL has changed. Official registry verifies new destination, outdated templates warn, and no citizen is sent to a suspicious/unverified domain.

**SC-04 — Already released:** An adoption candidate matches public records with the same agency/topic/date span. UI links the existing release and invites focused refinement; the participant can still pursue a reasonable legitimate distinct request.

**SC-05 — Extended processing:** A real agency acknowledgement has a receipt date, then a qualifying unusual-circumstances letter and an agreed altered schedule. Silence Clock shows both elapsed time and qualified processing state without pronouncing a legal violation.

**SC-06 — Fee estimate above cap:** User's authorized cap is below the agency's estimate. Site shows action required and does not falsely record consent, payment or amended request.

**SC-07 — Partial response:** Uploaded agency response includes a determination, several released PDFs, some redacted pages and a referral. Each category remains distinct; released page counts are derived only when extractable and verified.

**SC-08 — Third-party PII:** A newly uploaded PDF includes a third person's address and a recoverable black-box redaction. Scan holds publication; reviewer creates an actually redacted derivative; extracted text, OCR and preview cannot recover protected content.

**SC-09 — Allegedly missing record:** Editorial team adds an internal memo referenced by a released document; public view says `referenced but not located`, not `destroyed` or `wrongfully withheld`. Later agency says no responsive records; conflicting evidence is preserved, not overwritten.

**SC-10 — Participant anonymity:** Citizen files at the agency under legal name but publishes an attributed-free Public Receipt and source-backed record. Public APIs, search, PDF metadata, QR codes and Open Graph tags reveal no protected name or email.

**SC-11 — Emergency takedown:** A reviewer discovers wrongly exposed sensitive material. Public access is revoked, cache invalidation triggered, incident and export status reported; any existing third-party mirror limitation is communicated honestly.

**SC-12 — Account takeover simulation:** Auth token for requester A cannot download, edit, share or revoke requester B's private receipt or file. B's data does not appear in analytics/logs viewed by A.

**SC-13 — Offline dependencies:** FOIA Aggregator 503, FOIA.gov API stale, Render background process sleeping, and B2 capacity limited. The site gives accurate degraded status and safe read-only functionality where possible; no invented successful sync or filings.

**SC-14 — Public physical action:** User downloads a Walking Archive QR card and a Read the Record sheet for an approved public document. Printed QR resolves to current version with corrections and accessible source information.

**SC-15 — Engine Room:** When five real mapped PR packages have accepted evidence and four remain in review, Engine Room displays actual mappings with separate open, merged, deployed and production-tested states; it never infers that package numbers match GitHub PR numbers.

## Appendix D. Independent-account first-session script

A new agent should perform these steps **without needing to ask what The Public Record is**:

1. Read `docs/DEVELOPMENT_PLAN.md`, `docs/APPROVED_DECISIONS.md`, `docs/REQUIREMENTS_MATRIX.md`, `docs/OPEN_BLOCKERS.md`, and the current repository README.
2. Inspect current default branch, protected-branch configuration, all open PRs, merged PR SHAs, CI workflows, `.exechub/project.yml`, release tags, Render services and actual health/status evidence. Do not assume the 52 planned IDs represent 52 existing PRs.
3. Read the **current** FOIA Aggregator development handoff and source-coverage status, E2EESA current release/candidate status and audit, and Engine Room integration instructions. Reconcile interface schemas before coding.
4. Locate the lowest-numbered unaccepted TPR work package whose prerequisites are satisfied. Reuse ongoing work instead of opening duplicates, then implement in an isolated branch with tests, docs and acceptance evidence.
5. Merge only after passing all required checks and reviews; proceed to newly unblocked packages. When blocked, make progress on independent packages while preserving data/security contracts.
6. Deploy only to the correct configured staging/production target. Perform an external smoke test and record actual health, migration, object and worker results, or explicitly record that credentials/infrastructure are missing.
7. Update `docs/REQUIREMENTS_MATRIX.md`, `docs/ACCEPTANCE_EVIDENCE.md`, `docs/OPEN_BLOCKERS.md` and the Engine Room manifest after each validated milestone. Distinguish `planned`, `in progress`, `merged`, `deployed`, `production-accepted` and `blocked`.
8. Escalate only substantial product/legal/privacy choices, unavailable credentials or authorized spend; do not ask the user to approve routine implementation details.

**Execution reminder:** GitHub code changes and scheduled background development are not created by this plan. The plan supplies the exact handoff; an agent or connected development environment must carry it out and verify results.