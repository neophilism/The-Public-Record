import {createHash} from "node:crypto";
export interface EvidenceSource {
  id:string;
  publicUrl:string;
  observedAt:string;
  publishedAt:string|null;
  originalSourceId:string|null;
  sha256:string|null;
}
export interface SourceCitation {
  id:string;
  claimId:string;
  sourceId:string;
  page:number|null;
  section:string|null;
}
export type EvidenceIssueCode =
  "invalid_source"|"duplicate_source"|"invalid_citation"|"duplicate_citation"|
  "orphan_citation"|"broken_derivative"|"derivative_cycle";
export interface EvidenceIssue {code:EvidenceIssueCode;itemId:string}
const sourceId=/^[A-Za-z0-9:_-]{3,160}$/;
function validTimestamp(v:unknown):v is string {
  return typeof v==="string" && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
}
function safeUrl(text:string):boolean {
  try{
    const url=new URL(text);
    const host=url.hostname.toLowerCase();
    return url.protocol==="https:" && !url.username && !url.password && !url.port &&
      !url.hash && host.includes(".") && host!=="localhost" &&
      !host.endsWith(".local") && !host.endsWith(".internal") &&
      !/^\d+\.\d+\.\d+\.\d+$/.test(host) && !host.startsWith("[");
  }catch{return false;}
}
function validSource(s:EvidenceSource):boolean {
  return !!s && sourceId.test(s.id) && typeof s.publicUrl==="string" &&
    safeUrl(s.publicUrl) && validTimestamp(s.observedAt) &&
    (s.publishedAt===null || validTimestamp(s.publishedAt)) &&
    (s.sha256===null || (typeof s.sha256==="string" && /^[a-f0-9]{64}$/i.test(s.sha256))) &&
    (s.originalSourceId===null || sourceId.test(s.originalSourceId));
}
function validCitation(c:SourceCitation):boolean {
  return !!c && sourceId.test(c.id) && sourceId.test(c.claimId) && sourceId.test(c.sourceId) &&
    (c.page===null || (Number.isSafeInteger(c.page) && c.page>=1 && c.page<=100000)) &&
    (c.section===null || (typeof c.section==="string" && c.section.length>0 && c.section.length<=160));
}
/** An evidence hash is recorded only when bytes were actually available. */
export function sha256OfReceivedBytes(bytes:Uint8Array):string {
  if(!(bytes instanceof Uint8Array))throw Error("Received bytes required for source hashing");
  return createHash("sha256").update(bytes).digest("hex");
}
/** Offline graph audit. It does NOT assert that URLs currently resolve. */
export function auditEvidenceGraph(
  sources:readonly EvidenceSource[],
  citations:readonly SourceCitation[]
):EvidenceIssue[] {
  if(!Array.isArray(sources)||!Array.isArray(citations) ||
    sources.length>10000 || citations.length>100000)throw Error("Evidence graph exceeds safety limits");
  const issues:EvidenceIssue[]=[];
  const byId=new Map<string,EvidenceSource>(),citationIds=new Set<string>();
  for(const s of sources){
    if(!validSource(s)){issues.push({code:"invalid_source",itemId:s?.id??"unknown"});continue;}
    if(byId.has(s.id)){issues.push({code:"duplicate_source",itemId:s.id});continue;}
    byId.set(s.id,s);
  }
  for(const c of citations){
    if(!validCitation(c)){issues.push({code:"invalid_citation",itemId:c?.id??"unknown"});continue;}
    if(citationIds.has(c.id))issues.push({code:"duplicate_citation",itemId:c.id});
    citationIds.add(c.id);
    if(!byId.has(c.sourceId))issues.push({code:"orphan_citation",itemId:c.id});
  }
  for(const [id,s] of byId){
    if(s.originalSourceId!==null && !byId.has(s.originalSourceId))
      issues.push({code:"broken_derivative",itemId:id});
  }
  // Detect cycles in original/derivative chains without recursive stack overflow.
  const visited=new Set<string>(),cycleMarked=new Set<string>();
  for(const id of byId.keys()){
    if(visited.has(id))continue;
    const path:string[]=[],inPath=new Set<string>();
    let cursor:string|null=id;
    while(cursor!==null && byId.has(cursor) && !visited.has(cursor)){
      if(inPath.has(cursor)){
        for(const sourceId of path.slice(path.indexOf(cursor)))cycleMarked.add(sourceId);
        break;
      }
      path.push(cursor);inPath.add(cursor);
      cursor=byId.get(cursor)?.originalSourceId??null;
    }
    for(const item of path)visited.add(item);
  }
  for(const id of cycleMarked)issues.push({code:"derivative_cycle",itemId:id});
  return issues;
}
