import {describe,it,expect} from "vitest";
import {validateLocalDraft,renderLocalDraftText,type LocalRequestDraft} from "../lib/templates/plaintext-export";
const draft:LocalRequestDraft={agencyName:"Fictional Federal Office",description:"Copies of written guidance and meeting memoranda created in the fictional hearing process.",
 startDate:"2025-01-01",endDate:"2025-12-31",feeCapUsd:25,electronicCopies:true};
describe("local-only records request copy/export",()=>{
 it("generates a respectful records request while never claiming that it was filed",()=>{
   const output=renderLocalDraftText(draft);
   expect(output).toContain("To: Fictional Federal Office");
   expect(output).toContain("2025-01-01 through 2025-12-31");
   expect(output).toContain("$25.00");
   expect(output).toContain("electronic format");
   expect(output).toContain("did not file or transmit it");
   expect(output).toContain("Add your name and contact");
 });
 it("rejects impossible dates and missing agency or scope",()=>{
   expect(validateLocalDraft({...draft,startDate:"2025-02-30"})).not.toEqual([]);
   expect(validateLocalDraft({...draft,agencyName:""})).not.toEqual([]);
   expect(validateLocalDraft({...draft,description:"Too vague"})).not.toEqual([]);
   expect(()=>renderLocalDraftText({...draft,feeCapUsd:-5})).toThrow();
 });
 it("does not claim fee-waiver eligibility or silently submit",()=>{
   const text=renderLocalDraftText(draft);
   expect(text).not.toContain("I am eligible for a waiver");
   expect(text).not.toContain("Submitted to:");
 });
});
