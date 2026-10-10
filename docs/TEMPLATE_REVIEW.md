# TPR-17 — Versioned reviewed FOIA request templates

**Status:** schema, independent-review rules, version history and pin-to-adoption domain functions with synthetic tests. A persistent template editor, publication moderation service and authenticated member dashboard remain to be built.

A curated FOIA template specifies the federal agency component, records sought, optional dates, evidence sources, title and an editorial version number. Published templates require a distinct independent reviewer. User adoption makes a frozen, private copy of the selected version; later editorial revisions cannot silently replace language in an already adopted request.

A template is a records request aid, not a legal conclusion or an automated government submission. Personal identity, requester fee preferences and contact information belong to the individual's private draft, not the public canonical template.

Operational acceptance remains gated on PostgreSQL persistence, role-backed editor/reviewer assignment, versioned audit events, verified agency filing instructions, consent-aware publication, secure member access, and QA of retired/replaced templates. The sample references use fictional scenarios and never submit a real FOIA request.
