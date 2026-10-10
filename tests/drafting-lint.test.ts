import {describe,it,expect} from "vitest";
import {lintFoiaDraft,checkReadyForExport,type DraftContext} from "../lib/templates/drafting-lint";
const base:DraftContext={
  selectedAgencyComponentId:"8216158f-8089-431d-b866-dc334e8d4758",
  verifiedAgencyComponentId:"8216158f-8089-431d-b866-dc334e8d4758",
  officialAgencyChannelVerified:true,
  description:"Copies of the fictional agency's 2025 contract award memoranda and public correspondence.",
  startDate:"2025-01-01",endDate:"2025-12-31",feeCapUsd:25,
  feeWaiverRequested:false,feeWaiverExplanation:null,
  electronicDeliveryRequested:true,documentedSourceIds:["source-001"]
};
describe("request draft advisory lint",()=>{
  it("allows a properly scoped self-filed request without warnings",()=>{
    expect(lintFoiaDraft(base)).toEqual([]);
    expect(checkReadyForExport([],[]).ready).toBe(true);
  });
  it("does not export without verified official agency destination",()=>{
    const issues=lintFoiaDraft({...base,officialAgencyChannelVerified:false});
    expect(issues.map(i=>i.code)).toContain("agency_unverified");
    expect(checkReadyForExport(issues,[]).ready).toBe(false);
  });
  it("blocks unsupported waiver claims and bad fee amounts",()=>{
    const issues=lintFoiaDraft({...base,feeWaiverRequested:true,feeWaiverExplanation:"because I want it",feeCapUsd:-1});
    expect(issues.map(i=>i.code)).toContain("unsupported_fee_waiver");
    expect(issues.map(i=>i.code)).toContain("unreasonable_fee_cap");
  });
  it("flags overbroad record searches and out-of-order dates",()=>{
    const issues=lintFoiaDraft({...base,description:"All records ever about everything by this office.",startDate:"2025-12-31",endDate:"2025-01-01"});
    expect(issues.map(i=>i.code)).toContain("possibly_overbroad");
    expect(issues.map(i=>i.code)).toContain("invalid_date_range");
  });
  it("supports documented warning override but never a hard error override",()=>{
    const warnings=lintFoiaDraft({...base,electronicDeliveryRequested:false});
    const override={code:"missing_electronic_preference" as const,reason:"Paper copies are needed for a documented accessibility reason.",actorSubject:"member-1",recordedAt:"2026-10-10T00:00:00Z"};
    const accepted=checkReadyForExport(warnings,[override]);
    expect(accepted.ready).toBe(true);
    expect(accepted.recorded).toHaveLength(1);
    expect(checkReadyForExport([{code:"agency_unverified",severity:"error",message:"No channel"}],[{...override,code:"agency_unverified"}]).ready).toBe(false);
    expect(()=>checkReadyForExport(warnings,[{...override,reason:"no"}])).toThrow();
  });
  it("does not mistake a general question for a guaranteed records request",()=>{
    const issues=lintFoiaDraft({...base,description:"Why did the fictional agency make its 2025 decision?"});
    expect(issues.map(i=>i.code)).toContain("only_questions");
    expect(issues.map(i=>i.code)).toContain("no_records_sought");
  });
});
