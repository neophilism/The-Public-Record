-- A tombstone prevents disabled identities from silently reactivating.
CREATE TABLE IF NOT EXISTS tpr_private.oidc_members (
  issuer text NOT NULL CHECK (issuer LIKE 'https://%'),
  subject text NOT NULL CHECK (length(subject) BETWEEN 1 AND 255),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  PRIMARY KEY (issuer, subject)
);
REVOKE ALL ON tpr_private.oidc_members FROM PUBLIC;
CREATE INDEX IF NOT EXISTS oidc_sessions_member_idx
  ON tpr_private.oidc_sessions (issuer, subject)
  WHERE revoked_at IS NULL;
