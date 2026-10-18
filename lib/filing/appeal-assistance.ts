export interface AdverseDetermination {
  id:string;
  agencyComponentId:string;
  receivedAt:string;
  summary:string;
  sourceSha256:string;
}
export interface AppealGuidance {
  agencyComponentId:string;
  officialUrl:string;
  reviewedAt:string;
  appealAddress?:string;
}
export interface AppealEvent {
  id:string;
  determinationId:string;
  kind:"drafted"|"self_reported_filed"|"agency_response_reported";
  occurredAt:string;
  text:string;
}

function official(url:string):boolean {
  try {const u=new URL(url);return u.protocol==="https:"&&u.username===""&&u.password===""&&
    (u.hostname.endsWith(".gov")||u.hostname==="foia.gov")&&u.hash==="";}
  catch{return false;}
}
/** Show filing instructions only when their provenance was reviewed for this agency. */
export function appealGuide(determination:AdverseDetermination,guidance:AppealGuidance|undefined){
  const reviewed=guidance?.agencyComponentId===determination.agencyComponentId&&
    official(guidance.officialUrl)&&Number.isFinite(Date.parse(guidance.reviewedAt));
  return {
    determinationId:determination.id,
    agencyInstructions:reviewed?guidance!.officialUrl:null,
    status:reviewed?"reviewed_instructions":"verify_agency_instructions",
    ogisResource:"https://www.archives.gov/ogis",
    notice:"Review the agency's current appeal rules and any date in its letter. This tool does not file an appeal or confirm a deadline."
  } as const;
}

/** Events are appended in source order; a later appeal outcome does not replace the original denial. */
export function appealTimeline(determination:AdverseDetermination,events:AppealEvent[]){
  const history=events.filter(e=>e.determinationId===determination.id).map(e=>{
    if(!Number.isFinite(Date.parse(e.occurredAt)))throw new Error("Invalid appeal event date");
    return {id:e.id,kind:e.kind,occurredAt:e.occurredAt,text:e.text};
  });
  if(!Number.isFinite(Date.parse(determination.receivedAt)))throw new Error("Invalid determination date");
  return [{id:determination.id,kind:"adverse_determination",occurredAt:determination.receivedAt,text:determination.summary},
    ...history].sort((a,b)=>Date.parse(a.occurredAt)-Date.parse(b.occurredAt));
}

export function draftAppealText(determination:AdverseDetermination,reason:string):string {
  if(reason.trim().length<10||reason.length>4000)throw new Error("Appeal explanation required");
  return `I seek administrative review of the determination identified as ${determination.id}.\n\n${reason.trim()}\n\nPlease provide a written response and explain any available mediation or further review.\n`;
}
