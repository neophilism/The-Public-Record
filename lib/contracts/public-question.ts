export type ClaimStatus = "question_posed" | "uncorroborated_assertion" | "source_supported" |
  "agency_stated" | "document_confirmed" | "disputed" | "corrected";

export type MissingRecordStatus = "referenced_by_source" | "requested" | "no_responsive_records" |
  "withheld_stated_exemption" | "referred" | "expected_unverified" |
  "released" | "partial" | "unresolved";

/** Rich internal object may include unpublished and identifying data. */
export interface InternalQuestion {
  id:string;
  slug:string;
  headline:string;
  status: ClaimStatus;
  citation_ids:string[];
  internal_notes?:string;
  requester_identifier?:string;
  submitter_contact?:string;
}
export interface PublicQuestion {
  id:string; slug:string; headline:string; claim_status:ClaimStatus; citation_ids:string[];
}
export function toPublicQuestion(q:InternalQuestion):PublicQuestion {
  if (!q.id || !/^[a-z0-9-]{2,120}$/.test(q.slug) || !q.headline ||
    q.headline.length>500 || !Array.isArray(q.citation_ids) ||
    q.citation_ids.some(id=>typeof id!=="string" || !id.trim() || id.length>160) ||
    !["question_posed","uncorroborated_assertion","source_supported","agency_stated","document_confirmed","disputed","corrected"].includes(q.status)) {
      throw new Error("Invalid question");
  }
  if (["source_supported","agency_stated","document_confirmed"].includes(q.status) && !q.citation_ids.length)
    throw new Error("Documentary status requires citations");
  return {id:q.id,slug:q.slug,headline:q.headline,claim_status:q.status,citation_ids:[...q.citation_ids]};
}
