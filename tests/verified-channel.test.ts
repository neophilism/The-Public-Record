import {describe,it,expect} from "vitest";
import {evaluateFilingRoute,isMaterialChannelChange,verifyRedirectTarget,type ReviewedFilingRoute} from "../lib/filing/verified-channel";
const id="8216158f-8089-431d-b866-dc334e8d4758";
const now=new Date("2026-10-10T16:00:00Z");
const base={agencyComponentId:id,sourceUrl:"https://www.foia.gov/developer/",
  verifiedBy:"records-editor-1",verifiedAt:"2026-10-09T16:00:00Z",approval:"approved" as const};
const sources=["www.foia.gov"];
describe("individually reviewed FOIA self-filing destinations",()=>{
 it("accepts a reviewed portal URL at an exact allowlisted host",()=>{
   const route:ReviewedFilingRoute={...base,channel:{kind:"portal",portalUrl:"https://portal.foia.gov/request"}};
   const result=evaluateFilingRoute(route,sources,["portal.foia.gov"],now);
   expect(result.status).toBe("verified");
   expect(result.kind).toBe("portal");
   expect(result.destination).toBe("https://portal.foia.gov/request");
 });
 it("supports reviewed agency email instructions without sending any message",()=>{
   const route:ReviewedFilingRoute={...base,channel:{kind:"email",emailAddress:"requests@example.gov"}};
   const result=evaluateFilingRoute(route,sources,["example.gov"],now);
   expect(result.kind).toBe("email");
   expect(result.destination).toBe("mailto:requests@example.gov");
   expect(result.warning).toContain("yourself");
 });
 it("refuses similar-looking hostnames and user-info tricks",()=>{
   for(const url of ["https://portal.foia.gov.attacker.test/request",
     "https://portal.foia.gov@attacker.test/request","http://portal.foia.gov/request",
     "https://portal.foia.gov:8080/request",
     "https://portal.foia.gov/request?next=https%3A%2F%2Fattacker.test"]){
     expect(evaluateFilingRoute({...base,channel:{kind:"portal",portalUrl:url}},sources,["portal.foia.gov"],now).status).toBe("rejected");
   }
 });
 it("blocks unknown routes, rejected reviews and stale instructions",()=>{
   const route:ReviewedFilingRoute={...base,channel:{kind:"portal",portalUrl:"https://portal.foia.gov/request"}};
   expect(evaluateFilingRoute({...route,approval:"pending"},sources,["portal.foia.gov"],now).status).toBe("rejected");
   const stale=evaluateFilingRoute({...route,verifiedAt:"2025-01-01T00:00:00Z"},sources,["portal.foia.gov"],now);
   expect(stale.status).toBe("stale");
   expect(stale.destination).toBeNull();
   expect(evaluateFilingRoute({...route,agencyComponentId:"not-a-uuid"},sources,["portal.foia.gov"],now).status).toBe("rejected");
 });
 it("never accepts off-host redirect targets",()=>{
   expect(verifyRedirectTarget("https://portal.foia.gov/start","https://attacker.test/next",["portal.foia.gov"])).toBeNull();
   expect(verifyRedirectTarget("https://portal.foia.gov/start","/next",["portal.foia.gov"])).toBe("https://portal.foia.gov/next");
 });
 it("forces review again after material channel changes",()=>{
   const initial:ReviewedFilingRoute={...base,channel:{kind:"portal",portalUrl:"https://portal.foia.gov/first"}};
   expect(isMaterialChannelChange(initial,{...initial,channel:{kind:"portal",portalUrl:"https://portal.foia.gov/second"}})).toBe(true);
 });
});
