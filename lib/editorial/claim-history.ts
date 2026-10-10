/** Publication is an editorial decision: raw submissions never become public. */
export type ClaimLabel =
  "question_posed"|"uncorroborated_assertion"|"source_supported"|
  "agency_stated"|"document_confirmed"|"disputed"|"corrected";
export interface InternalClaimRevision {
  claimId:string;
  version:number;
  statement:string;
  label:ClaimLabel;
  citedSourceIds:readonly string[];
  conflictingSourceIds:readonly string[];
  status:"draft"|"published"|"withdrawn";
  authorId:string;
  reviewerId:string|null;
  changedAt:string;
  correctedFrom:number|null;
  correctionReason:string|null;
  privateNotes?:string;
  submitterContact?:string;
}
export interface PublishedClaimRevision {
  version:number;
  statement:string;
  label:ClaimLabel;
  citedSourceIds:string[];
  conflictingSourceIds:string[];
  changedAt:string;
  correctionReason:string|null;
  correctedFrom:number|null;
}
export interface PublishedClaimHistory {
  claimId:string;
  latest:PublishedClaimRevision|null;
  publishedVersions:PublishedClaimRevision[];
  withdrawn:boolean;
}
const positive=new Set<ClaimLabel>(["source_supported","agency_stated","document_confirmed"]);
function validSources(ids:readonly string[]):boolean {
  return Array.isArray(ids) && ids.length<=100 &&
    ids.every(id=>typeof id==="string" && /^[a-zA-Z0-9:_-]{3,160}$/.test(id)) &&
    new Set(ids).size===ids.length;
}
function publicProjection(item:InternalClaimRevision):PublishedClaimRevision {
  return {version:item.version,statement:item.statement,label:item.label,
    citedSourceIds:[...item.citedSourceIds],conflictingSourceIds:[...item.conflictingSourceIds],
    changedAt:item.changedAt,correctedFrom:item.correctedFrom,correctionReason:item.correctionReason};
}
export function buildPublishedClaimHistory(input:readonly InternalClaimRevision[]):PublishedClaimHistory|null {
  if(!Array.isArray(input) || !input.length || input.length>200)return null;
  const ordered=[...input].sort((a,b)=>a.version-b.version);
  const claimId=ordered[0].claimId;
  let previousTime=0;
  const published:PublishedClaimRevision[]=[];
  const approvedVersions=new Set<number>();
  let withdrawn=false;
  for(let i=0;i<ordered.length;i++){
    const item=ordered[i], t=Date.parse(item.changedAt);
    if(item.claimId!==claimId || !claimId || item.version!==i+1 ||
       !item.statement.trim() || item.statement.length>4000 ||
       !Number.isFinite(t) || t<previousTime ||
       !validSources(item.citedSourceIds) || !validSources(item.conflictingSourceIds) ||
       !["question_posed","uncorroborated_assertion","source_supported",
         "agency_stated","document_confirmed","disputed","corrected"].includes(item.label) ||
       !["draft","published","withdrawn"].includes(item.status))
      throw Error("Invalid editorial revision sequence");
    previousTime=t;
    if(item.status==="draft")continue;
    if(typeof item.reviewerId!=="string" || !item.reviewerId.trim() ||
       item.reviewerId===item.authorId)throw Error("Independent editorial approval required");
    if(positive.has(item.label) && item.citedSourceIds.length===0)
      throw Error("Source-backed claim needs cited records");
    if(item.label==="disputed" && item.conflictingSourceIds.length===0)
      throw Error("Disputed source requires conflicting evidence");
    if(item.label==="corrected"){
      if(item.correctedFrom===null || !approvedVersions.has(item.correctedFrom) ||
         !item.correctionReason?.trim() || item.correctionReason.length>1000)
        throw Error("Correction needs visible prior approval and reason");
    }else if(item.correctedFrom!==null || item.correctionReason!==null)
      throw Error("Correction metadata requires corrected label");
    approvedVersions.add(item.version);
    if(item.status==="withdrawn"){withdrawn=true;continue;}
    if(withdrawn)throw Error("Withdrawn claims require a new reviewed publication workflow");
    published.push(publicProjection(item));
  }
  if(!published.length && !withdrawn)return null;
  return {claimId,latest:withdrawn?null:published.at(-1)??null,
    publishedVersions:published,withdrawn};
}
