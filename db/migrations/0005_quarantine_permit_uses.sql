-- One-time server-side upload claim ledger. No object can be published here.
CREATE TABLE IF NOT EXISTS tpr_private.quarantine_permit_uses (
  nonce_sha256 text PRIMARY KEY CHECK (nonce_sha256 ~ '^[0-9a-f]{64}$'),
  owner_subject text NOT NULL CHECK (length(owner_subject) BETWEEN 1 AND 255),
  draft_id text NOT NULL,
  object_key text NOT NULL UNIQUE CHECK (object_key LIKE 'private/quarantine/v1/%'),
  mime text NOT NULL,
  reserved_bytes bigint NOT NULL CHECK (reserved_bytes BETWEEN 1 AND 52428800),
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (draft_id,owner_subject)
    REFERENCES tpr_private.request_drafts(id,owner_subject) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS quarantine_permit_owner_idx
  ON tpr_private.quarantine_permit_uses(owner_subject,claimed_at DESC);
ALTER TABLE tpr_private.quarantine_permit_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpr_private.quarantine_permit_uses FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only_quarantine_permits ON tpr_private.quarantine_permit_uses
  USING (owner_subject=current_setting('tpr.subject',true))
  WITH CHECK (owner_subject=current_setting('tpr.subject',true));
REVOKE ALL ON tpr_private.quarantine_permit_uses FROM PUBLIC;
