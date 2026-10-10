import {canTransition,type RequestState} from "../domain/request-state";

/** Transport/source provenance is independently verified by a later authenticated service. */
export type EventSource = "requester_report" | "verified_agency_document" | "reviewed_publication";
export interface RequestEventEvidence {
  source: EventSource;
  evidence_id: string | null;
  reviewer_verified: boolean;
}

/** Domain gate; this is NOT authorization to read/change another person's request. */
export function allowsEvidencedTransition(
  from: RequestState,
  to: RequestState,
  evidence: RequestEventEvidence
): boolean {
  if (!canTransition(from,to)) return false;
  if (typeof evidence !== "object" || !evidence) return false;
  if (!["requester_report","verified_agency_document","reviewed_publication"].includes(evidence.source)) return false;
  const hasEvidence = typeof evidence.evidence_id === "string" &&
    evidence.evidence_id.length>0 && evidence.evidence_id.length<=160;
  switch (to) {
    case "acknowledged":
    case "in_process":
    case "released":
    case "partially_released":
    case "denied":
      return evidence.source==="verified_agency_document" && hasEvidence && evidence.reviewer_verified === true;
    case "archived":
      return evidence.source==="reviewed_publication" && hasEvidence && evidence.reviewer_verified === true;
    case "appealed":
      return evidence.source==="requester_report" && hasEvidence;
    case "submitted_unverified":
      return evidence.source==="requester_report";
    case "adopted":
    case "draft":
    case "unclaimed":
      return evidence.source==="requester_report";
  }
}
