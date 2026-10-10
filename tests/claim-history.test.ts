import {describe,it,expect} from "vitest";
import {buildPublishedClaimHistory,type InternalClaimRevision} from "../lib/editorial/claim-history";
const base={
  claimId:"claim-01",authorId:"writer-a",reviewerId:"editor-b",
  status:"published" as const,changedAt:"2026-10-10T12:00:00Z",
  citedSourceIds:[],conflictingSourceIds:[],
  correctedFrom:null,correctionReason:null
};
const v1:InternalClaimRevision={...base,version:1,statement:"Which documents exist?",
  label:"question_posed",privateNotes:"do not publish",submitterContact:"hidden@example.org"};
describe("editorial history and source evidence",()=>{
 it("preserves original text when a reviewed correction supersedes it",()=>{
   const two:InternalClaimRevision={...base,version:2,statement:"A released memo records the meeting",
     label:"source_supported",citedSourceIds:["source-001"],changedAt:"2026-10-10T12:10:00Z"};
   const three:InternalClaimRevision={...base,version:3,label:"corrected",
     statement:"The memo records a preliminary meeting, not a final decision",
     correctedFrom:2,correctionReason:"Earlier wording overstated the record",
     citedSourceIds:["source-001"],changedAt:"2026-10-10T12:20:00Z"};
   const history=buildPublishedClaimHistory([three,v1,two])!;
   expect(history.latest?.version).toBe(3);
   expect(history.publishedVersions.map(x=>x.version)).toEqual([1,2,3]);
   expect(history.publishedVersions[1].statement).toContain("released memo");
   expect(history.latest?.correctionReason).toContain("overstated");
   expect(JSON.stringify(history)).not.toContain("hidden@example.org");
   expect(JSON.stringify(history)).not.toContain("do not publish");
 });
 it("denies self-approved publication and allegations with a false evidence label",()=>{
   expect(()=>buildPublishedClaimHistory([{...v1,reviewerId:"writer-a"}])).toThrow();
   expect(()=>buildPublishedClaimHistory([{...v1,label:"document_confirmed"}])).toThrow();
 });
 it("requires direct contradictory sources for disputed labels",()=>{
   expect(()=>buildPublishedClaimHistory([{...v1,label:"disputed"}])).toThrow();
   const ok=buildPublishedClaimHistory([{...v1,label:"disputed",
     conflictingSourceIds:["source-for","source-against"]}]);
   expect(ok?.latest?.conflictingSourceIds).toEqual(["source-for","source-against"]);
 });
 it("rejects missing, duplicate and nonexistent corrected versions",()=>{
   expect(()=>buildPublishedClaimHistory([{...v1,version:2}])).toThrow();
   expect(()=>buildPublishedClaimHistory([v1,{...v1}])).toThrow();
   expect(()=>buildPublishedClaimHistory([v1,{...v1,version:2,label:"corrected",
     correctionReason:"Fixed",correctedFrom:9}])).toThrow();
 });
 it("never publishes pending draft revisions",()=>{
   const draft:InternalClaimRevision={...v1,version:2,status:"draft",
     reviewerId:null,statement:"unreviewed changes",changedAt:"2026-10-10T12:10:00Z"};
   const history=buildPublishedClaimHistory([v1,draft])!;
   expect(history.latest?.version).toBe(1);
   expect(JSON.stringify(history)).not.toContain("unreviewed changes");
 });
});
