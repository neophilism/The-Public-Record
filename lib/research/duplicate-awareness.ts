import {createHash} from "node:crypto";

/**
 * Matching records are suggestions to inspect, not a legal bar to a new request.
 * Cross-user identities and private draft text must never be sent to public search.
 */
export interface RequestScope {
  componentId:string;
  recordsDescription:string;
  startDate:string|null;
  endDate:string|null;
}
export interface PublicRecordMatch {
  id:string;
  publicUrl:string;
  componentId:string;
  fingerprint:string|null;
  title:string;
}
export interface ExistingRequestMatch {
  publicId:string;
  componentId:string;
  fingerprint:string;
  publiclyVisible:boolean;
}
export interface MatchNotice {
  kind:"already_released"|"similar_public_request";
  id:string;
  publicUrl:string|null;
  confidence:"same_scope"|"possible";
  advice:string;
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function normalize(description:string):string {
  return description.normalize("NFKC").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
}
function safePublicUrl(value:string):boolean {
  try {const u=new URL(value);return u.protocol==="https:"&&u.hostname.includes(".")&&!u.username&&!u.password&&!u.hash&&u.port==="";}
  catch{return false;}
}
export function fingerprintRequestScope(scope:RequestScope):string {
  if(!scope || !uuid.test(scope.componentId) ||
     typeof scope.recordsDescription!=="string" ||
     scope.recordsDescription.length>6000 || normalize(scope.recordsDescription).length<15 ||
     (scope.startDate!==null && !/^\d{4}-\d{2}-\d{2}$/.test(scope.startDate)) ||
     (scope.endDate!==null && !/^\d{4}-\d{2}-\d{2}$/.test(scope.endDate)) ||
     (scope.startDate!==null && scope.endDate!==null && scope.startDate>scope.endDate))
    throw Error("Invalid request scope");
  const canonical=[
    scope.componentId.toLowerCase(),scope.startDate??"open",scope.endDate??"open",
    normalize(scope.recordsDescription)
  ].join("\x1f");
  return createHash("sha256").update("public-record-scope-v1\x1f"+canonical).digest("hex");
}
export function findDocumentedDuplicates(
  draft:RequestScope,
  released:readonly PublicRecordMatch[],
  previouslyRequested:readonly ExistingRequestMatch[]
):MatchNotice[] {
  if(released.length>500 || previouslyRequested.length>500)throw Error("Matching corpus must be bounded");
  const target=fingerprintRequestScope(draft);
  const results:MatchNotice[]=[];
  for(const candidate of released){
    if(!candidate || candidate.componentId.toLowerCase()!==draft.componentId.toLowerCase() ||
       !safePublicUrl(candidate.publicUrl))continue;
    const confidence=candidate.fingerprint===target?"same_scope":"possible";
    // Do not treat a title text match as proof the precise records already exist.
    if(confidence!=="same_scope")continue;
    results.push({kind:"already_released",id:candidate.id,publicUrl:candidate.publicUrl,
      confidence,advice:"Review the cited released document before filing a new request"});
  }
  for(const candidate of previouslyRequested){
    if(!candidate || !candidate.publiclyVisible ||
       candidate.componentId.toLowerCase()!==draft.componentId.toLowerCase() ||
       candidate.fingerprint!==target)continue;
    results.push({kind:"similar_public_request",id:candidate.publicId,publicUrl:null,
      confidence:"same_scope",advice:"A similar request has been documented; individual circumstances may still differ"});
  }
  return results.slice(0,100);
}
export interface DuplicateOverride {
  decision:"file_separately"|"use_existing";
  rationale:string;
  actorSubject:string;
  recordedAt:string;
}
export function requireReasonedDecision(notices:readonly MatchNotice[],override?:DuplicateOverride):boolean {
  if(!notices.length)return true;
  if(!override || !["file_separately","use_existing"].includes(override.decision) ||
     !override.actorSubject?.trim() || !override.rationale ||
     override.rationale.trim().length<25 || override.rationale.length>1000 ||
     !Number.isFinite(Date.parse(override.recordedAt)))return false;
  return true;
}
