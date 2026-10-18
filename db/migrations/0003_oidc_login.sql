-- Short-lived, browser-bound authorization transactions. Only a trusted backend
-- role may access this table; no grants to the public or participant DB roles.
CREATE TABLE IF NOT EXISTS tpr_private.oidc_login_transactions (
  state_sha256 text PRIMARY KEY CHECK (state_sha256 ~ '^[0-9a-f]{64}$'),
  browser_sha256 text NOT NULL CHECK (browser_sha256 ~ '^[0-9a-f]{64}$'),
  nonce text NOT NULL CHECK (length(nonce)=43),
  code_verifier text NOT NULL CHECK (length(code_verifier)=43),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oidc_login_expiry_idx
  ON tpr_private.oidc_login_transactions(expires_at);
REVOKE ALL ON tpr_private.oidc_login_transactions FROM PUBLIC;

CREATE TABLE IF NOT EXISTS tpr_private.oidc_sessions (
  sid_sha256 text PRIMARY KEY CHECK (sid_sha256 ~ '^[0-9a-f]{64}$'),
  issuer text NOT NULL CHECK (issuer LIKE 'https://%'),
  subject text NOT NULL CHECK (length(subject) BETWEEN 1 AND 255),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oidc_sessions_expiry_idx ON tpr_private.oidc_sessions(expires_at);
REVOKE ALL ON tpr_private.oidc_sessions FROM PUBLIC;
