import {describe,it,expect} from "vitest";
import {allowsEvidencedTransition} from "../lib/contracts/request-evidence";
import {toPublicQuestion} from "../lib/contracts/public-question";
import {validatePageOptions,validateIdempotencyKey} from "../lib/contracts/request-options";
import mapping from "../.exechub/approved-pr-mapping.json";
import openapi from "../openapi/public-record-v1.json";

describe("request event proof gating",()=>{
  const requester={source:"requester_report" as const,evidence_id:null,reviewer_verified:false};
  it("lets participants self-report without claiming receipt",()=>{
    expect(allowsEvidencedTransition("draft","submitted_unverified",requester)).toBe(true);
    expect(allowsEvidencedTransition("submitted_unverified","acknowledged",requester)).toBe(false);
  });
  it("requires reviewed agency evidence for an acknowledgement or determination",()=>{
    expect(allowsEvidencedTransition("submitted_unverified","acknowledged",{source:"verified_agency_document",evidence_id:"agency-confirmation-1",reviewer_verified:true})).toBe(true);
    expect(allowsEvidencedTransition("submitted_unverified","acknowledged",{source:"verified_agency_document",evidence_id:null,reviewer_verified:true})).toBe(false);
    expect(allowsEvidencedTransition("in_process","denied",{source:"verified_agency_document",evidence_id:"determination-1",reviewer_verified:false})).toBe(false);
  });
  it("reserves archive publication to approved review",()=>{
    expect(allowsEvidencedTransition("released","archived",requester)).toBe(false);
    expect(allowsEvidencedTransition("released","archived",{source:"reviewed_publication",evidence_id:"review-1",reviewer_verified:true})).toBe(true);
  });
});
describe("safe external API projections",()=>{
  it("strips private metadata from public question objects",()=>{
    const x=toPublicQuestion({id:"q1",slug:"records-request",headline:"Which memoranda exist?",status:"question_posed",citation_ids:[],submitter_contact:"not public",internal_notes:"not public"});
    expect(Object.keys(x).sort()).toEqual(["citation_ids","claim_status","headline","id","slug"].sort());
    expect(JSON.stringify(x)).not.toContain("not public");
  });
  it("does not mark undocumented claims as confirmed",()=>{
    expect(()=>toPublicQuestion({id:"q1",slug:"records-request",headline:"Claim",status:"document_confirmed",citation_ids:[]})).toThrow();
  });
  it("bounds pagination and idempotency syntax",()=>{
    expect(validatePageOptions({})).toEqual({page:1,limit:20});
    expect(()=>validatePageOptions({limit:101})).toThrow();
    expect(()=>validateIdempotencyKey("tiny")).toThrow();
    expect(validateIdempotencyKey("request_1234567890_A")).toBe("request_1234567890_A");
  });
  it("keeps an exact 52-work-package roadmap with verified mappings only",()=>{
    expect(mapping.pullRequestNumbers).toHaveLength(52);
    expect(mapping.pullRequestNumbers.slice(0,3)).toEqual([1,2,3]);
    expect(mapping.pullRequestNumbers.slice(3).every(v=>v===null)).toBe(true);
  });
  it("declares OpenAPI schemas without pretending unfinished API endpoints exist",()=>{
    expect(openapi.openapi).toBe("3.1.0");
    expect(Object.keys(openapi.paths)).toEqual(["/api/health"]);
    expect(JSON.stringify(openapi.components.schemas.PublicQuestion)).not.toContain("submitter_contact");
  });
});
