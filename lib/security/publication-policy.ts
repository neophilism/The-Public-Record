/**
 * Defense-in-depth domain policy only. Server authorization, storage
 * permissions, content scans and durable consent/audit are future gates.
 */
export type GrantStatus = "absent" | "granted" | "revoked";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type DocumentClassification = "private_original" | "quarantine" | "publication_derivative";

export interface PublicationDecision {
  classification: DocumentClassification;
  grant: GrantStatus;
  reviewer: ReviewStatus;
  scan: "unscanned" | "passed" | "blocked";
  consent_item_id: string | null;
  derivative_id: string | null;
  derivative_sha256: string | null;
  approved_for_distribution: boolean;
}

/** Only explicit review of a specific derivative and an active grant allows public release. */
export function canPublish(input:PublicationDecision):boolean {
  return input.classification === "publication_derivative" &&
    input.grant === "granted" &&
    input.reviewer === "approved" &&
    input.scan === "passed" &&
    typeof input.consent_item_id==="string" && input.consent_item_id.length>0 &&
    typeof input.derivative_id==="string" && input.derivative_id.length>0 &&
    typeof input.derivative_sha256==="string" && /^[a-f0-9]{64}$/i.test(input.derivative_sha256);
}

/** Replication is a distinct opt-in from consent to host a web page. */
export function canReplicate(input:PublicationDecision):boolean {
  return canPublish(input) && input.approved_for_distribution===true;
}

export interface PublicDerivativeManifest {
  derivative_id: string;
  sha256: string;
  version: "public-derivative/v1";
}

/** Allowlisted projection: ignores all extra private runtime metadata. */
export function toPublicDerivativeManifest(
  input:PublicationDecision & Record<string,unknown>
):PublicDerivativeManifest|null {
  if(!canPublish(input))return null;
  return {version:"public-derivative/v1",derivative_id:input.derivative_id!,sha256:input.derivative_sha256!};
}
