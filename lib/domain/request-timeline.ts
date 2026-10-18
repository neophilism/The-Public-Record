import {allowsEvidencedTransition,type RequestEventEvidence} from "../contracts/request-evidence";
import type {RequestState} from "./request-state";

export interface StateTransitionEvent {
  kind:"transition";
  id:string;
  previousId:string|null;
  from:RequestState;
  to:RequestState;
  evidence:RequestEventEvidence;
  recordedAt:string;
}
export interface StateCorrectionEvent {
  kind:"correction";
  id:string;
  targetId:string;
  replacement:Pick<StateTransitionEvent,"from"|"to"|"evidence">;
  reason:string;
  recordedAt:string;
}
export type TimelineEvent=StateTransitionEvent|StateCorrectionEvent;
export interface TimelineProjection {
  state:RequestState;
  appliedIds:string[];
  conflictIds:string[];
  history:Array<TimelineEvent & {superseded:boolean}>;
}
const idRe=/^[A-Za-z0-9_-]{3,128}$/;
function validTime(value:string):boolean {
  return typeof value==="string" && /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    Number.isFinite(Date.parse(value));
}
/** Rebuild from causality, not arrival order. Ambiguity stops advancement. */
export function rebuildRequestTimeline(initial:RequestState,events:readonly TimelineEvent[]):TimelineProjection {
  const unique=new Map<string,TimelineEvent>();
  for(const event of events) {
    if(!event || !idRe.test(event.id) || !validTime(event.recordedAt))
      throw new Error("Invalid request event");
    const prior=unique.get(event.id);
    if(prior && JSON.stringify(prior)!==JSON.stringify(event))
      throw new Error("Conflicting event identifier");
    unique.set(event.id,event);
  }
  const all=[...unique.values()];
  const transitions=all.filter((event):event is StateTransitionEvent=>event.kind==="transition");
  const corrections=all.filter((event):event is StateCorrectionEvent=>event.kind==="correction");
  if(transitions.length+corrections.length!==all.length)throw new Error("Unknown event kind");
  const correctionByTarget=new Map<string,StateCorrectionEvent>();
  for(const correction of corrections) {
    if(!idRe.test(correction.targetId) || !transitions.some(e=>e.id===correction.targetId) ||
       !correction.reason?.trim() || correction.reason.length>1000 ||
       correctionByTarget.has(correction.targetId))
      throw new Error("Ambiguous request correction");
    correctionByTarget.set(correction.targetId,correction);
  }
  const appliedIds:string[]=[], conflicts=new Set<string>();
  let state=initial,previousId:string|null=null;
  while(true) {
    const next=transitions.filter(event=>event.previousId===previousId && !appliedIds.includes(event.id));
    if(next.length===0)break;
    if(next.length!==1) {next.forEach(event=>conflicts.add(event.id));break;}
    const event=next[0],effective=correctionByTarget.get(event.id)?.replacement??event;
    if(effective.from!==state || !allowsEvidencedTransition(effective.from,effective.to,effective.evidence)) {
      conflicts.add(event.id);break;
    }
    appliedIds.push(event.id);
    state=effective.to;
    previousId=event.id;
  }
  for(const event of transitions)if(!appliedIds.includes(event.id))conflicts.add(event.id);
  return {state,appliedIds,conflictIds:[...conflicts].sort(),
    history:all.sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt)||a.id.localeCompare(b.id))
      .map(event=>({...event,superseded:event.kind==="transition" && correctionByTarget.has(event.id)}))};
}
