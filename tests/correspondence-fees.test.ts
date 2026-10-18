import {describe,it,expect} from "vitest";
import {feePosition,publicCorrespondenceSummary,type Correspondence} from "./correspondence-fees";

const letter:Correspondence={id:"fee-1",ownerSubject:"person-A",kind:"fee_estimate",agencyComponentId:"agency-1",receivedAt:"2026-10-18T12:00:00Z",sourceSha256:"a".repeat(64),privateBody:"Personal address and case facts",estimateCents:7500};
describe("private correspondence and fee decisions",()=>{
  it("requires a matching explicit decision after the estimate",()=>{
    expect(feePosition(letter,undefined)).toEqual({status:"awaiting_user",payableCents:0});
    expect(feePosition(letter,{correspondenceId:"fee-1",ownerSubject:"person-A",decision:"approve",approvedCapCents:5000,decidedAt:"2026-10-18T13:00:00Z"})).toEqual({status:"above_cap",payableCents:0});
    expect(feePosition(letter,{correspondenceId:"fee-1",ownerSubject:"person-A",decision:"approve",approvedCapCents:7500,decidedAt:"2026-10-18T13:00:00Z"})).toEqual({status:"approved_within_cap",payableCents:7500});
  });
  it("rejects another owner's decision and preserves a decline",()=>{
    expect(()=>feePosition(letter,{correspondenceId:"fee-1",ownerSubject:"person-B",decision:"approve",approvedCapCents:9000,decidedAt:"2026-10-18T13:00:00Z"})).toThrow();
    expect(feePosition(letter,{correspondenceId:"fee-1",ownerSubject:"person-A",decision:"decline",approvedCapCents:0,decidedAt:"2026-10-18T13:00:00Z"}).payableCents).toBe(0);
  });
  it("removes personal content from a public projection",()=>{
    const result=publicCorrespondenceSummary(letter);
    expect(JSON.stringify(result)).not.toContain(letter.privateBody);
    expect(JSON.stringify(result)).not.toContain(letter.ownerSubject);
    expect(result.provenance).toBe("unverified");
  });
});
