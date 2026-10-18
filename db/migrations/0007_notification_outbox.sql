-- Consent events and generic notifications contain no email address or case body.
CREATE TABLE IF NOT EXISTS tpr_private.notification_consent_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_subject text NOT NULL CHECK (length(owner_subject) BETWEEN 1 AND 255),
  category text NOT NULL CHECK (category IN ('case_update')),
  event_action text NOT NULL CHECK (event_action IN ('subscribed','unsubscribed')),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_consent_latest_idx ON
  tpr_private.notification_consent_events(owner_subject,category,id DESC);
CREATE TRIGGER notification_consent_append_only
  BEFORE UPDATE OR DELETE ON tpr_private.notification_consent_events
  FOR EACH ROW EXECUTE FUNCTION tpr_private.reject_event_mutation();

CREATE TABLE IF NOT EXISTS tpr_private.notification_outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_subject text NOT NULL CHECK (length(owner_subject) BETWEEN 1 AND 255),
  category text NOT NULL CHECK (category IN ('case_update')),
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 128),
  link_path text NOT NULL CHECK (link_path LIKE '/public-record/%'),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','leased','sent','dead')),
  attempts int NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  sent_at timestamptz,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_subject,idempotency_key)
);
CREATE INDEX IF NOT EXISTS notification_pending_idx ON
  tpr_private.notification_outbox(state,available_at,id);

ALTER TABLE tpr_private.notification_consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.notification_consent_events FORCE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.notification_outbox FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only_notification_consent ON tpr_private.notification_consent_events
  USING (owner_subject=current_setting('tpr.subject',true))
  WITH CHECK (owner_subject=current_setting('tpr.subject',true));
CREATE POLICY owner_only_notification_outbox ON tpr_private.notification_outbox
  USING (owner_subject=current_setting('tpr.subject',true))
  WITH CHECK (owner_subject=current_setting('tpr.subject',true));
REVOKE ALL ON tpr_private.notification_consent_events FROM PUBLIC;
REVOKE ALL ON tpr_private.notification_outbox FROM PUBLIC;
