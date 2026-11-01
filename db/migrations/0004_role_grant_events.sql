-- TPR-08: append-only server-owned role decisions. Runtime identities receive
-- SELECT only; role writes require a separate privileged provisioning path.
CREATE TABLE IF NOT EXISTS tpr_private.role_grant_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issuer text NOT NULL CHECK (issuer LIKE 'https://%'),
  subject text NOT NULL CHECK (length(subject) BETWEEN 1 AND 255),
  role text NOT NULL CHECK (role IN ('requester','contributor','researcher','editor',
    'records_reviewer','moderator','admin','operator')),
  event_action text NOT NULL CHECK (event_action IN ('granted','revoked')),
  actor_subject text NOT NULL CHECK (length(actor_subject) BETWEEN 1 AND 255),
  reason text NOT NULL CHECK (length(reason) BETWEEN 1 AND 1000),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS role_grant_lookup_idx ON
  tpr_private.role_grant_events(issuer,subject,role,id DESC);
CREATE TRIGGER role_grant_events_append_only
  BEFORE UPDATE OR DELETE ON tpr_private.role_grant_events
  FOR EACH ROW EXECUTE FUNCTION tpr_private.reject_event_mutation();
ALTER TABLE tpr_private.role_grant_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.role_grant_events FORCE ROW LEVEL SECURITY;
CREATE POLICY role_events_subject_read ON tpr_private.role_grant_events
  FOR SELECT USING (issuer=current_setting('tpr.issuer',true) AND
    subject=current_setting('tpr.subject',true));
REVOKE ALL ON tpr_private.role_grant_events FROM PUBLIC;
