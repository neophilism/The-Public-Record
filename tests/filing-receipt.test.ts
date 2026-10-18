import {createHash} from "node:crypto";
import {describe,expect,it} from "vitest";
import {parseParticipantFilingReport,proofMatchesDigest} from "../lib/filing/filing-receipt";

const draft={draftId:"draft-001",filedOn:"2026-10-10",caseNumber:"XYZ-123",proofSha256:null};
describe("participant filing and proof boundary",()=>{
  it("labels a self-reported case number as unverified",()=>{
    expect(parseParticipantFilingReport(draft)).toEqual({...draft,
      confirmation:"participant_reported_unverified"});
  });
  it("refuses forged agency or reviewer confirmation fields",()=>{
    for(const field of [{agencyConfirmed:true},{reviewer_verified:true},
      {source:"verified_agency_document"},{confirmation:"agency_confirmed"}])
      expect(()=>parseParticipantFilingReport({...draft,...field})).toThrow();
  });
  it("rejects impossible dates, oversized identifiers and mismatched private proof",()=>{
    expect(()=>parseParticipantFilingReport({...draft,filedOn:"2026-02-30"})).toThrow();
    expect(()=>parseParticipantFilingReport({...draft,filedOn:"2099-01-01"})).toThrow();
    expect(()=>parseParticipantFilingReport({...draft,caseNumber:"x".repeat(121)})).toThrow();
    const proof=Buffer.from("synthetic private receipt bytes");
    const sha=createHash("sha256").update(proof).digest("hex");
    expect(proofMatchesDigest(proof,sha)).toBe(true);
    expect(proofMatchesDigest(Buffer.from("tampered"),sha)).toBe(false);
    expect(proofMatchesDigest(proof,"invalid")).toBe(false);
  });
});
