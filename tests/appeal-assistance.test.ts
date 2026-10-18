import {describe,it,expect} from "vitest";
import {appealGuide,appealTimeline,draftAppealText,type AdverseDetermination} from "./appeal-assistance";
const denial:AdverseDetermination={id:"d-1",agencyComponentId:"a-1",receivedAt:"2026-10-01T00:00:00Z",summary:"Adverse determination reported",sourceSha256:"a".repeat(64)};
describe("appeal assistance",()=>{
  it("requires agency-matched reviewed official instructions",()=>{
    expect(appealGuide(denial,undefined).agencyInstructions).toBeNull();
    expect(appealGuide(denial,{agencyComponentId:"a-2",officialUrl:"https://agency.gov/appeal",reviewedAt:"2026-10-02"}).agencyInstructions).toBeNull();
    expect(appealGuide(denial,{agencyComponentId:"a-1",officialUrl:"https://agency.gov.evil.example/appeal",reviewedAt:"2026-10-02"}).agencyInstructions).toBeNull();
    expect(appealGuide(denial,{agencyComponentId:"a-1",officialUrl:"https://agency.gov/appeal",reviewedAt:"2026-10-02"}).agencyInstructions).toBe("https://agency.gov/appeal");
  });
  it("retains the original denial after a later appeal result",()=>{
    const result=appealTimeline(denial,[{id:"appeal-1",determinationId:"d-1",kind:"agency_response_reported",occurredAt:"2026-10-12T00:00:00Z",text:"Appeal response reported"}]);
    expect(result.map(x=>x.kind)).toEqual(["adverse_determination","agency_response_reported"]);
  });
  it("only produces a user draft and refuses empty explanations",()=>{
    expect(()=>draftAppealText(denial,"short")).toThrow();
    expect(draftAppealText(denial,"Please review the stated exemption.")).toContain("I seek administrative review");
  });
});
