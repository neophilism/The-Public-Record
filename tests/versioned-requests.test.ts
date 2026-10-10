import {describe,it,expect} from "vitest";
import {pinReviewedTemplate,validateTemplateHistory,type RequestTemplate} from "../lib/templates/versioned-requests";
const base:RequestTemplate={templateId:"requests-office-memos",version:1,
 title:"Agency memoranda",agencyComponentId:"8216158f-8089-431d-b866-dc334e8d4758",
 recordsDescription:"Records and memoranda regarding the agency's fictional public hearing during 2025.",
 rangeStart:"2025-01-01",rangeEnd:"2025-12-31",state:"published",
 editorId:"editor-a",reviewerId:"reviewer-b",sourceIds:["agency-page-01"]};
describe("verified FOIA template lifecycle",()=>{
 it("pins participant copies to an immutable selected published version",()=>{
   const selected=pinReviewedTemplate(base,"member-123");
   const changed={...base,version:2,recordsDescription:"Records for a later unrelated hearing."};
   validateTemplateHistory([base,changed]);
   expect(selected.templateVersion).toBe(1);
   expect(selected.recordsDescription).toContain("during 2025");
   expect(Object.isFrozen(selected)).toBe(true);
 });
 it("rejects unreviewed or self-reviewed published templates",()=>{
   expect(()=>pinReviewedTemplate({...base,state:"draft"},"member-123")).toThrow();
   expect(()=>pinReviewedTemplate({...base,reviewerId:"editor-a"},"member-123")).toThrow();
   expect(()=>pinReviewedTemplate(base,"")).toThrow();
 });
 it("rejects impossible and reversed date ranges",()=>{
   expect(()=>pinReviewedTemplate({...base,rangeStart:"2025-02-31"},"member-123")).toThrow();
   expect(()=>pinReviewedTemplate({...base,rangeStart:"2025-12-31",rangeEnd:"2025-01-01"},"member-123")).toThrow();
 });
 it("denies duplicate, missing and silently superseded draft revisions",()=>{
   expect(()=>validateTemplateHistory([base,{...base}])).toThrow();
   expect(()=>validateTemplateHistory([{...base,version:2}])).toThrow();
   expect(()=>validateTemplateHistory([{...base,state:"draft",reviewerId:null},{...base,version:2}])).toThrow();
 });
});
