import {describe,expect,it} from "vitest";
import {buildSelfFilingGuide} from "../lib/filing/self-filing-guide";
import type {ReviewedFilingRoute} from "../lib/filing/verified-channel";

const now=new Date("2026-10-10T16:00:00Z");
const base={agencyComponentId:"8216158f-8089-431d-b866-dc334e8d4758",
  sourceUrl:"https://www.foia.gov/developer/",verifiedBy:"fixture-reviewer",
  verifiedAt:"2026-10-09T16:00:00Z",approval:"approved" as const};
const sources=["www.foia.gov"];
describe("human self-filing guide",()=>{
  it("provides no direct destination when no current reviewed route exists",()=>{
    const guide=buildSelfFilingGuide(undefined,sources,[],now);
    expect(guide.status).toBe("unavailable");
    expect(guide.destination).toBeNull();
    expect(guide.notice).toContain("No request has been submitted");
  });
  it("supports reviewed portal and email channels without submitting",()=>{
    const portal:ReviewedFilingRoute={...base,channel:{kind:"portal",portalUrl:"https://portal.foia.gov/request"}};
    const email:ReviewedFilingRoute={...base,channel:{kind:"email",emailAddress:"requests@example.gov"}};
    expect(buildSelfFilingGuide(portal,sources,["portal.foia.gov"],now).destination)
      .toBe("https://portal.foia.gov/request");
    expect(buildSelfFilingGuide(email,sources,["example.gov"],now).destination)
      .toBe("mailto:requests@example.gov");
    expect(buildSelfFilingGuide(email,sources,["example.gov"],now).steps.join(" "))
      .toContain("yourself");
  });
  it("suppresses stale, spoofed or unapproved direct destinations",()=>{
    const route:ReviewedFilingRoute={...base,channel:{kind:"portal",portalUrl:"https://portal.foia.gov/request"}};
    for(const changed of [{...route,approval:"pending" as const},
      {...route,verifiedAt:"2025-01-01T00:00:00Z"},
      {...route,channel:{kind:"portal" as const,portalUrl:"https://portal.foia.gov.attacker.test"}}]) {
      const guide=buildSelfFilingGuide(changed,sources,["portal.foia.gov"],now);
      expect(guide.status).toBe("unavailable");
      expect(guide.destination).toBeNull();
    }
  });
});
