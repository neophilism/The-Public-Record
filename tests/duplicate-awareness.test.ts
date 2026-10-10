import {describe,it,expect} from "vitest";
import {fingerprintRequestScope,findDocumentedDuplicates,requireReasonedDecision,type RequestScope} from "../lib/research/duplicate-awareness";
const scope:RequestScope={componentId:"8216158f-8089-431d-b866-dc334e8d4758",
  recordsDescription:"Fictional 2025 agency meeting minutes and decision memoranda",
  startDate:"2025-01-01",endDate:"2025-12-31"};
describe("research-first duplicate awareness",()=>{
  it("canonicalizes harmless punctuation/case variations",()=>{
    expect(fingerprintRequestScope(scope)).toBe(fingerprintRequestScope({
      ...scope,recordsDescription:"  fictional 2025 AGENCY meeting minutes and decision memoranda! "}));
  });
  it("keeps distinct date ranges, agencies and subjects separate",()=>{
    expect(fingerprintRequestScope(scope)).not.toBe(fingerprintRequestScope({...scope,startDate:"2024-01-01"}));
    expect(fingerprintRequestScope(scope)).not.toBe(fingerprintRequestScope({...scope,componentId:"1216158f-8089-431d-b866-dc334e8d4758"}));
    expect(fingerprintRequestScope(scope)).not.toBe(fingerprintRequestScope({...scope,recordsDescription:"Different policy analysis records for a fictional public workshop"}));
  });
  it("surfaces an exact released record without blocking an individual request",()=>{
    const fingerprint=fingerprintRequestScope(scope);
    const notices=findDocumentedDuplicates(scope,[
      {id:"doc-001",componentId:scope.componentId,fingerprint,publicUrl:"https://www.example.gov/reading-room/doc",
        title:"Fictional disclosure"}],[]);
    expect(notices).toHaveLength(1);
    expect(notices[0].kind).toBe("already_released");
    expect(requireReasonedDecision(notices)).toBe(false);
    expect(requireReasonedDecision(notices,{decision:"file_separately",
      rationale:"I need an additional earlier version that may not have been released.",
      actorSubject:"citizen-001",recordedAt:"2026-10-10T16:00:00Z"})).toBe(true);
  });
  it("ignores private requests and unsafe public links",()=>{
    const fingerprint=fingerprintRequestScope(scope);
    const notices=findDocumentedDuplicates(scope,[
      {id:"secret",componentId:scope.componentId,fingerprint,publicUrl:"http://localhost/private",
        title:"Not public"}],
      [{publicId:"private-001",componentId:scope.componentId,fingerprint,publiclyVisible:false}]);
    expect(notices).toEqual([]);
  });
  it("does not confuse a weak title similarity with proven matching coverage",()=>{
    const notices=findDocumentedDuplicates(scope,[
      {id:"candidate",componentId:scope.componentId,fingerprint:null,
       publicUrl:"https://www.example.gov/reading-room",title:scope.recordsDescription}],[]);
    expect(notices).toHaveLength(0);
  });
});
