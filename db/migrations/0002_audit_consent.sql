-- TPR-10: private append-only audit and consent trail. Applied transactionally.
CREATE TABLE IF NOT EXISTS tpr_private.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_subject text NOT NULL CHECK (length(owner_subject) BETWEEN 1 AND 255),
  actor_subject text NOT NULL CHECK (length(actor_subject) BETWEEN 1 AND 255),
  action_code text NOT NULL CHECK (action_code IN (
    'draft_created','draft_updated','request_self_reported','agency_evidence_reviewed',
    'evidence_quarantined','evidence_scan_result','consent_granted',
    'consent_revoked','publication_reviewed','access_grant_changed',
    'retention_requested','retention_resolved'
  )),
  object_kind text NOT NULL CHECK (object_kind IN (
    'request_draft','request_event','quarantine_object','publication_consent',
    'publication_derivative','retention_request','role_grant'
  )),
  object_id text NOT NULL CHECK (length(object_id) BETWEEN 1 AND 160),
  source_sha256 text CHECK (source_sha256 IS NULL OR source_sha256 ~ '^[a-fA-F0-9]{64}$'),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_owner_time_idx
  ON tpr_private.audit_events(owner_subject,occurred_at,id);

CREATE TABLE IF NOT EXISTS tpr_private.consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_subject text NOT NULL,
  quarantine_object_id text NOT NULL,
  scope text NOT NULL CHECK (scope IN ('web_publication','distributed_replication')),
  event_action text NOT NULL CHECK (event_action IN ('granted','revoked')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  evidence_sha256 text CHECK (evidence_sha256 IS NULL OR evidence_sha256 ~ '^[a-fA-F0-9]{64}$'),
  FOREIGN KEY (quarantine_object_id,owner_subject)
    REFERENCES tpr_private.quarantine_objects(id,owner_subject) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS consent_events_owner_item_time_idx
  ON tpr_private.consent_events(owner_subject,quarantine_object_id,scope,recorded_at DESC,id DESC);

CREATE TABLE IF NOT EXISTS tpr_private.retention_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_subject text NOT NULL CHECK (length(owner_subject) BETWEEN 1 AND 255),
  target_type text NOT NULL CHECK (target_type IN ('draft','quarantine_object','published_derivative')),
  target_id text NOT NULL CHECK (length(target_id) BETWEEN 1 AND 160),
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolution text CHECK (resolution IS NULL OR resolution IN ('fulfilled','partially_fulfilled','denied')),
  CHECK ((resolved_at IS NULL AND resolution IS NULL) OR (resolved_at IS NOT NULL AND resolution IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS retention_requests_owner_idx
  ON tpr_private.retention_requests(owner_subject,requested_at DESC);

-- Prevent ordinary SQL UPDATE/DELETE from silently rewriting an event history.
CREATE OR REPLACE FUNCTION tpr_private.reject_event_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Audit and consent event history is append-only';
END;
$$;
CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON tpr_private.audit_events
  FOR EACH ROW EXECUTE FUNCTION tpr_private.reject_event_mutation();
CREATE TRIGGER consent_events_append_only
  BEFORE UPDATE OR DELETE ON tpr_private.consent_events
  FOR EACH ROW EXECUTE FUNCTION tpr_private.reject_event_mutation();

ALTER TABLE tpr_private.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.audit_events FORCE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.consent_events FORCE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.retention_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.retention_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only_audit ON tpr_private.audit_events
  USING (owner_subject = current_setting('tpr.subject',true))
  WITH CHECK (owner_subject = current_setting('tpr.subject',true));
CREATE POLICY owner_only_consent_events ON tpr_private.consent_events
  USING (owner_subject = current_setting('tpr.subject',true))
  WITH CHECK (owner_subject = current_setting('tpr.subject',true));
CREATE POLICY owner_only_retention ON tpr_private.retention_requests
  USING (owner_subject = current_setting('tpr.subject',true))
  WITH CHECK (owner_subject = current_setting('tpr.subject',true));
