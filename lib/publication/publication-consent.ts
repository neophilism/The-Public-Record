export type Field="title"|"summary"|"document"|"agency"|"date";
export interface PublicationEvent {
  id:string;derivativeId:string;derivativeSha256:string;version:number;
  kind:"grant"|"withdraw"|"editor_approve"|"editor_reject";
  actorSubject:string;occurredAt:string;fields:Field[];
}
export interface PublicationState {
  publishableFields:Field[];withdrawn:boolean;needsCachePurge:boolean;version:number;
}
const allowed=new Set<Field>(["title","summary","document","agency","date"]);

/** Replays immutable events for one exact derivative version and hash. */
export function publicationState(events:PublicationEvent[],derivativeId:string,version:number,sha256:string):PublicationState {
  if(!derivativeId||!Number.isSafeInteger(version)||version<1||!/^[a-f0-9]{64}$/.test(sha256))
    throw new Error("Invalid derivative identity");
  const seen=new Set<string>();let consent=new Set<Field>(),editor=new Set<Field>();
  let withdrawn=false,needsCachePurge=false;
  for(const e of events){
    if(seen.has(e.id))throw new Error("Duplicate publication event");
    seen.add(e.id);
    if(e.derivativeId!==derivativeId||e.version!==version||e.derivativeSha256!==sha256)continue;
    if(!e.actorSubject||!Number.isFinite(Date.parse(e.occurredAt))||
       !Array.isArray(e.fields)||e.fields.some(f=>!allowed.has(f)))throw new Error("Invalid publication event");
    if(e.kind==="grant") {consent=new Set(e.fields);withdrawn=false;}
    else if(e.kind==="withdraw") {consent.clear();withdrawn=true;needsCachePurge=true;}
    else if(e.kind==="editor_approve")editor=new Set(e.fields);
    else if(e.kind==="editor_reject")editor.clear();
    else throw new Error("Invalid publication event");
  }
  return {publishableFields:withdrawn?[]:[...consent].filter(f=>editor.has(f)),
    withdrawn,needsCachePurge,version};
}
