-- TPR-08: bind every private owner to the OIDC issuer as well as subject.
-- Older rows remain quarantined (owner_issuer NULL) until reviewed backfill.
-- NOT VALID checks permit migration over those rows but reject new unscoped data.
ALTER TABLE tpr_private.request_drafts ADD COLUMN owner_issuer text;
ALTER TABLE tpr_private.request_drafts ADD CONSTRAINT request_drafts_issuer_required
  CHECK (owner_issuer IS NOT NULL AND owner_issuer LIKE 'https://%') NOT VALID;
DROP POLICY owner_only_drafts ON tpr_private.request_drafts;
CREATE POLICY owner_only_drafts ON tpr_private.request_drafts
  USING (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true))
  WITH CHECK (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true));
ALTER TABLE tpr_private.request_events ADD COLUMN owner_issuer text;
ALTER TABLE tpr_private.request_events ADD CONSTRAINT request_events_issuer_required
  CHECK (owner_issuer IS NOT NULL AND owner_issuer LIKE 'https://%') NOT VALID;
DROP POLICY owner_only_events ON tpr_private.request_events;
CREATE POLICY owner_only_events ON tpr_private.request_events
  USING (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true))
  WITH CHECK (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true));
ALTER TABLE tpr_private.quarantine_objects ADD COLUMN owner_issuer text;
ALTER TABLE tpr_private.quarantine_objects ADD CONSTRAINT quarantine_objects_issuer_required
  CHECK (owner_issuer IS NOT NULL AND owner_issuer LIKE 'https://%') NOT VALID;
DROP POLICY owner_only_quarantine ON tpr_private.quarantine_objects;
CREATE POLICY owner_only_quarantine ON tpr_private.quarantine_objects
  USING (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true))
  WITH CHECK (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true));
ALTER TABLE tpr_private.publication_grants ADD COLUMN owner_issuer text;
ALTER TABLE tpr_private.publication_grants ADD CONSTRAINT publication_grants_issuer_required
  CHECK (owner_issuer IS NOT NULL AND owner_issuer LIKE 'https://%') NOT VALID;
DROP POLICY owner_only_grants ON tpr_private.publication_grants;
CREATE POLICY owner_only_grants ON tpr_private.publication_grants
  USING (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true))
  WITH CHECK (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true));
ALTER TABLE tpr_private.audit_events ADD COLUMN owner_issuer text;
ALTER TABLE tpr_private.audit_events ADD CONSTRAINT audit_events_issuer_required
  CHECK (owner_issuer IS NOT NULL AND owner_issuer LIKE 'https://%') NOT VALID;
DROP POLICY owner_only_audit ON tpr_private.audit_events;
CREATE POLICY owner_only_audit ON tpr_private.audit_events
  USING (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true))
  WITH CHECK (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true));
ALTER TABLE tpr_private.consent_events ADD COLUMN owner_issuer text;
ALTER TABLE tpr_private.consent_events ADD CONSTRAINT consent_events_issuer_required
  CHECK (owner_issuer IS NOT NULL AND owner_issuer LIKE 'https://%') NOT VALID;
DROP POLICY owner_only_consent_events ON tpr_private.consent_events;
CREATE POLICY owner_only_consent_events ON tpr_private.consent_events
  USING (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true))
  WITH CHECK (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true));
ALTER TABLE tpr_private.retention_requests ADD COLUMN owner_issuer text;
ALTER TABLE tpr_private.retention_requests ADD CONSTRAINT retention_requests_issuer_required
  CHECK (owner_issuer IS NOT NULL AND owner_issuer LIKE 'https://%') NOT VALID;
DROP POLICY owner_only_retention ON tpr_private.retention_requests;
CREATE POLICY owner_only_retention ON tpr_private.retention_requests
  USING (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true))
  WITH CHECK (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true));

ALTER TABLE tpr_private.request_drafts
  ADD CONSTRAINT drafts_owner_identity UNIQUE (id,owner_subject,owner_issuer);
ALTER TABLE tpr_private.quarantine_objects
  ADD CONSTRAINT quarantine_owner_identity UNIQUE (id,owner_subject,owner_issuer);
ALTER TABLE tpr_private.request_events
  ADD CONSTRAINT request_events_owner_identity_fk
  FOREIGN KEY (draft_id,owner_subject,owner_issuer)
  REFERENCES tpr_private.request_drafts(id,owner_subject,owner_issuer)
  ON DELETE RESTRICT NOT VALID;
ALTER TABLE tpr_private.quarantine_objects
  ADD CONSTRAINT quarantine_owner_identity_fk
  FOREIGN KEY (draft_id,owner_subject,owner_issuer)
  REFERENCES tpr_private.request_drafts(id,owner_subject,owner_issuer)
  ON DELETE RESTRICT NOT VALID;
ALTER TABLE tpr_private.publication_grants
  ADD CONSTRAINT publication_owner_identity_fk
  FOREIGN KEY (quarantine_object_id,owner_subject,owner_issuer)
  REFERENCES tpr_private.quarantine_objects(id,owner_subject,owner_issuer)
  ON DELETE RESTRICT NOT VALID;
ALTER TABLE tpr_private.consent_events
  ADD CONSTRAINT consent_owner_identity_fk
  FOREIGN KEY (quarantine_object_id,owner_subject,owner_issuer)
  REFERENCES tpr_private.quarantine_objects(id,owner_subject,owner_issuer)
  ON DELETE RESTRICT NOT VALID;
