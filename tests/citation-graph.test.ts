import {describe,it,expect} from "vitest";
import {sha256OfReceivedBytes,auditEvidenceGraph,type EvidenceSource,type SourceCitation} from "../lib/evidence/citation-graph";
const base:EvidenceSource={id:"source-001",publicUrl:"https://www.justice.gov/oip",
 observedAt:"2026-10-10T14:00:00Z",publishedAt:null,originalSourceId:null,sha256:null};
const cited:SourceCitation={id:"cite-001",claimId:"claim-001",sourceId:"source-001",page:2,section:"Paragraph 3"};
describe("source provenance and citation graph",()=>{
 it("hashes only actual provided source bytes",()=>{
   expect(sha256OfReceivedBytes(Buffer.from("sample synthetic document"))).toMatch(/^[a-f0-9]{64}$/);
   expect(auditEvidenceGraph([base],[cited])).toEqual([]);
 });
 it("detects citations for missing or duplicate sources",()=>{
   const issues=auditEvidenceGraph([base,base],[cited,{...cited,id:"cite-002",sourceId:"missing-source"}]);
   expect(issues.map(i=>i.code)).toContain("duplicate_source");
   expect(issues.map(i=>i.code)).toContain("orphan_citation");
 });
 it("refuses insecure or internal source addresses",()=>{
   for(const url of ["http://www.justice.gov/oip","https://localhost/secret",
     "https://127.0.0.1/file","https://username:secret@www.justice.gov/oip"]){
     expect(auditEvidenceGraph([{...base,publicUrl:url}],[cited]).some(i=>i.code==="invalid_source")).toBe(true);
   }
 });
 it("flags missing derivatives and circular original references",()=>{
   const a:EvidenceSource={...base,id:"source-aaa",originalSourceId:"source-bbb"};
   const b:EvidenceSource={...base,id:"source-bbb",originalSourceId:"source-aaa"};
   const codes=auditEvidenceGraph([a,b],[]).map(i=>i.code);
   expect(codes).toContain("derivative_cycle");
   expect(auditEvidenceGraph([{...a,originalSourceId:"source-missing"}],[]).map(i=>i.code)).toContain("broken_derivative");
 });
 it("rejects invalid page citations and unsupported hash claims",()=>{
   expect(auditEvidenceGraph([base],[{...cited,page:0}]).map(i=>i.code)).toContain("invalid_citation");
   expect(auditEvidenceGraph([{...base,sha256:"not-a-real-digest"}],[]).map(i=>i.code)).toContain("invalid_source");
 });
});
