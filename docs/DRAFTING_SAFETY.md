# TPR-18 — FOIA request drafting guidance and safeguards

**Status:** private draft lint and recorded warning override contracts with synthetic tests; no UI, agency filing API, participant account or legal review is represented as complete.

Request wording must reasonably describe existing agency records, not demand an explanation. This advisory linter checks scope, official agency component match, sensible date range, electronic delivery preferences, a user-chosen fee ceiling, and any supported explanation for an **optional** fee waiver. Neither the system nor an editor should automatically claim the requester's eligibility for a waiver.

Errors prevent export in the domain readiness result. Warnings may be overridden only with an explicit attributable reason and timestamp; overrides must eventually be written into an audited, user-owned private record. A regex lint pass is not proof that the selected request is legally correct, sufficiently specific, privileged, exempt, or guaranteed to receive an agency determination.

Official resources for future on-screen plain-language copy:
- https://www.foia.gov/how-to.html
- https://www.justice.gov/oip/freedom-information-act-5-usc-552
- https://www.archives.gov/ogis

**Remaining operational work:** authenticated saved requests, official agency-channel persistence/verification, responsive editing and validation UI, document export, fee category guidance with source timestamps, stored override audit events and user-controlled self-filing (TPR-19–21). No automatic filing is implemented.
