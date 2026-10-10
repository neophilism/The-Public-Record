-- TPR-06 initial schema. No real data, direct user API, or secrets are provisioned.
CREATE SCHEMA IF NOT EXISTS tpr_public;
CREATE SCHEMA IF NOT EXISTS tpr_private;

CREATE TABLE IF NOT EXISTS tpr_public.questions (
  id text PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 120),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,120}$'),
  headline text NOT NULL CHECK (length(headline) BETWEEN 1 AND 500),
  claim_status text NOT NULL DEFAULT 'question_posed' CHECK (claim_status IN
    ('question_posed','uncorroborated_assertion','source_supported','agency_stated',
     'document_confirmed','disputed','corrected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tpr_public.citations (
  id text PRIMARY KEY,
  question_id text NOT NULL REFERENCES tpr_public.questions(id) ON DELETE RESTRICT,
  source_url text NOT NULL CHECK (source_url LIKE 'https://%'),
  source_label text NOT NULL,
  sha256 text CHECK (sha256 IS NULL OR sha256 ~ '^[0-9a-fA-F]{64}$'),
  observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS citations_question_idx ON tpr_public.citations(question_id);

CREATE TABLE IF NOT EXISTS tpr_public.agencies (
  component_id text PRIMARY KEY,
  display_name text NOT NULL,
  official_url text NOT NULL CHECK (official_url LIKE 'https://%'),
  last_verified_at timestamptz,
  catalog_source text NOT NULL
);

CREATE TABLE IF NOT EXISTS tpr_private.request_drafts (
  id text PRIMARY KEY,
  owner_subject text NOT NULL CHECK (length(owner_subject) BETWEEN 1 AND 255),
  agency_component_id text REFERENCES tpr_public.agencies(component_id) ON DELETE RESTRICT,
  draft_body text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT 'adopted' CHECK (state IN
    ('adopted','draft','submitted_unverified','acknowledged','in_process',
     'released','partially_released','denied','appealed','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id,owner_subject)
);
CREATE INDEX IF NOT EXISTS drafts_owner_idx ON tpr_private.request_drafts(owner_subject,updated_at DESC);

CREATE TABLE IF NOT EXISTS tpr_private.request_events (
  id text PRIMARY KEY,
  draft_id text NOT NULL,
  owner_subject text NOT NULL,
  from_state text NOT NULL,
  to_state text NOT NULL,
  source text NOT NULL CHECK (source IN ('requester_report','verified_agency_document','reviewed_publication')),
  evidence_ref text,
  reviewer_verified boolean NOT NULL DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (draft_id,owner_subject)
    REFERENCES tpr_private.request_drafts(id,owner_subject) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS request_events_timeline_idx ON tpr_private.request_events(draft_id,recorded_at);

CREATE TABLE IF NOT EXISTS tpr_private.quarantine_objects (
  id text PRIMARY KEY,
  draft_id text NOT NULL,
  owner_subject text NOT NULL,
  private_storage_key text NOT NULL UNIQUE,
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-fA-F]{64}$'),
  scan_status text NOT NULL DEFAULT 'unscanned' CHECK (scan_status IN ('unscanned','passed','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id,owner_subject),
  FOREIGN KEY (draft_id,owner_subject)
    REFERENCES tpr_private.request_drafts(id,owner_subject) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS quarantine_owner_idx ON tpr_private.quarantine_objects(owner_subject);

CREATE TABLE IF NOT EXISTS tpr_private.publication_grants (
  id text PRIMARY KEY,
  quarantine_object_id text NOT NULL,
  owner_subject text NOT NULL,
  grant_status text NOT NULL CHECK (grant_status IN ('granted','revoked')),
  distribution_opt_in boolean NOT NULL DEFAULT false,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  FOREIGN KEY (quarantine_object_id,owner_subject)
    REFERENCES tpr_private.quarantine_objects(id,owner_subject) ON DELETE RESTRICT,
  CHECK ((grant_status='revoked' AND revoked_at IS NOT NULL) OR
         (grant_status='granted' AND revoked_at IS NULL))
);
CREATE INDEX IF NOT EXISTS publication_grants_owner_idx ON tpr_private.publication_grants(owner_subject);

-- Even the table owner is subject to RLS, except privileged database roles.
ALTER TABLE tpr_private.request_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.request_drafts FORCE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.request_events FORCE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.quarantine_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.quarantine_objects FORCE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.publication_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.publication_grants FORCE ROW LEVEL SECURITY;

CREATE POLICY owner_only_drafts ON tpr_private.request_drafts
  USING (owner_subject = current_setting('tpr.subject',true))
  WITH CHECK (owner_subject = current_setting('tpr.subject',true));
CREATE POLICY owner_only_events ON tpr_private.request_events
  USING (owner_subject = current_setting('tpr.subject',true))
  WITH CHECK (owner_subject = current_setting('tpr.subject',true));
CREATE POLICY owner_only_quarantine ON tpr_private.quarantine_objects
  USING (owner_subject = current_setting('tpr.subject',true))
  WITH CHECK (owner_subject = current_setting('tpr.subject',true));
CREATE POLICY owner_only_grants ON tpr_private.publication_grants
  USING (owner_subject = current_setting('tpr.subject',true))
  WITH CHECK (owner_subject = current_setting('tpr.subject',true));
