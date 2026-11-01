-- Existing permit claims without issuer are quarantined from runtime access.
ALTER TABLE tpr_private.quarantine_permit_uses ADD COLUMN owner_issuer text;
ALTER TABLE tpr_private.quarantine_permit_uses
  ADD CONSTRAINT quarantine_permit_issuer_required
  CHECK (owner_issuer IS NOT NULL AND owner_issuer LIKE 'https://%') NOT VALID;
DROP POLICY owner_only_quarantine_permits ON tpr_private.quarantine_permit_uses;
CREATE POLICY owner_only_quarantine_permits ON tpr_private.quarantine_permit_uses
  USING (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true))
  WITH CHECK (owner_subject=current_setting('tpr.subject',true)
    AND owner_issuer=current_setting('tpr.issuer',true));
