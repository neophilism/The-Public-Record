import {describe,expect,it} from "vitest";
import {rebuildRequestTimeline,type StateTransitionEvent,type StateCorrectionEvent} from "../lib/domain/request-timeline";

const reported={source:"requester_report" as const,evidence_id:null,reviewer_verified:false};
const reviewed={source:"verified_agency_document" as const,evidence_id:"agency-proof-1",reviewer_verified:true};
const adopt:StateTransitionEvent={kind:"transition",id:"event-adopt",previousId:null,
  from:"unclaimed",to:"adopted",evidence:reported,recordedAt:"2026-10-10T10:00:00Z"};
const draft:StateTransitionEvent={kind:"transition",id:"event-draft",previousId:adopt.id,
  from:"adopted",to:"draft",evidence:reported,recordedAt:"2026-10-10T10:01:00Z"};
const submit:StateTransitionEvent={kind:"transition",id:"event-submit",previousId:draft.id,
  from:"draft",to:"submitted_unverified",evidence:reported,recordedAt:"2026-10-10T10:02:00Z"};
const acknowledge:StateTransitionEvent={kind:"transition",id:"event-ack",previousId:submit.id,
  from:"submitted_unverified",to:"acknowledged",evidence:reviewed,recordedAt:"2026-10-10T10:03:00Z"};

describe("causal request timeline",()=>{
  it("rebuilds out-of-order and repeated deliveries deterministically",()=>{
    const result=rebuildRequestTimeline("unclaimed",[acknowledge,submit,draft,adopt,submit]);
    expect(result.state).toBe("acknowledged");
    expect(result.appliedIds).toEqual([adopt.id,draft.id,submit.id,acknowledge.id]);
    expect(result.conflictIds).toEqual([]);
    expect(result.history).toHaveLength(4);
  });
  it("stops on conflicting branches or a forged agency acknowledgement",()=>{
    const alternate={...draft,id:"event-other"};
    const conflict=rebuildRequestTimeline("unclaimed",[adopt,draft,alternate]);
    expect(conflict.state).toBe("adopted");
    expect(conflict.conflictIds).toEqual([draft.id,alternate.id]);
    const forged=rebuildRequestTimeline("unclaimed",[adopt,draft,submit,
      {...acknowledge,evidence:reported}]);
    expect(forged.state).toBe("submitted_unverified");
    expect(forged.conflictIds).toEqual([acknowledge.id]);
  });
  it("retains a correction and original event while recomputing downstream state",()=>{
    const correction:StateCorrectionEvent={kind:"correction",id:"correction-one",
      targetId:submit.id,replacement:{from:"draft",to:"unclaimed",evidence:reported},
      reason:"Participant withdrew the reported filing",recordedAt:"2026-10-11T00:00:00Z"};
    const result=rebuildRequestTimeline("unclaimed",[adopt,draft,submit,acknowledge,correction]);
    expect(result.state).toBe("unclaimed");
    expect(result.conflictIds).toEqual([acknowledge.id]);
    expect(result.history.find(event=>event.id===submit.id)?.superseded).toBe(true);
    expect(result.history.find(event=>event.id===correction.id)?.superseded).toBe(false);
  });
  it("rejects conflicting duplicate identifiers rather than silently rewriting history",()=>{
    expect(()=>rebuildRequestTimeline("unclaimed",[adopt,{...adopt,to:"draft"} as StateTransitionEvent])).toThrow();
  });
});
