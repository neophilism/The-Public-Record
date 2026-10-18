export type PublicDocumentKind="release"|"correspondence";
export interface PublicSource {
  documentId:string;kind:PublicDocumentKind;sha256:string;sourceUrl:string;
  sourceSnapshotSha256:string;reviewedAt:string;title:string;
}
export interface ArchiveMatch {externalId:string;sha256:string;url:string;}
export interface PublicCitation {
  id:string;documentId:string;kind:PublicDocumentKind;sha256:string;
  sourceUrl:string;sourceSnapshotSha256:string;archiveUrl:string|null;
  title:string;provenance:"reviewed_local";
}
const digest=/^[a-f0-9]{64}$/;
function httpsUrl(s:string):boolean {try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false}}

/** Local reviewed source remains the provenance anchor when archive lookup fails. */
export function publicCitation(source:PublicSource,match:ArchiveMatch|undefined):PublicCitation {
  if(!source.documentId||!digest.test(source.sha256)||!digest.test(source.sourceSnapshotSha256)||
     !httpsUrl(source.sourceUrl)||!Number.isFinite(Date.parse(source.reviewedAt))||
     !source.title.trim()||!["release","correspondence"].includes(source.kind))
    throw new Error("Unreviewed public source");
  const archiveUrl=match&&match.sha256===source.sha256&&match.externalId&&httpsUrl(match.url)?match.url:null;
  return {id:`public-record:${source.documentId}:${source.sha256}`,documentId:source.documentId,
    kind:source.kind,sha256:source.sha256,sourceUrl:source.sourceUrl,
    sourceSnapshotSha256:source.sourceSnapshotSha256,archiveUrl,title:source.title,
    provenance:"reviewed_local"};
}

export function dedupePublicCitations(items:PublicCitation[]):PublicCitation[] {
  const byHash=new Map<string,PublicCitation>();
  for(const item of items){
    const key=`${item.kind}:${item.sha256}`;
    const existing=byHash.get(key);
    if(!existing||item.id<existing.id)byHash.set(key,item);
  }
  return [...byHash.values()].sort((a,b)=>a.id.localeCompare(b.id));
}
