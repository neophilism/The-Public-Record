export type CorrespondenceKind="agency_letter"|"fee_estimate"|"clarification"|"referral";
export interface Correspondence {
  id:string;
  ownerSubject:string;
  kind:CorrespondenceKind;
  agencyComponentId:string;
  receivedAt:string;
  sourceSha256:string;
  verifiedBy?:string;
  privateBody:string;
  estimateCents?:number;
}
export interface FeeDecision {
  correspondenceId:string;
  ownerSubject:string;
  decision:"approve"|"decline";
  approvedCapCents:number;
  decidedAt:string;
}
export interface FeePosition {status:"awaiting_user"|"declined"|"approved_within_cap"|"above_cap";payableCents:0|number;}

function validMoney(cents:number):boolean {
  return Number.isSafeInteger(cents)&&cents>=0&&cents<=10_000_000;
}
/** An estimate or earlier user cap alone never authorizes payment. */
export function feePosition(letter:Correspondence,decision:FeeDecision|undefined):FeePosition {
  if(letter.kind!=="fee_estimate"||!validMoney(letter.estimateCents as number)||
     !Number.isFinite(Date.parse(letter.receivedAt)))throw new Error("Invalid fee estimate");
  if(!decision)return {status:"awaiting_user",payableCents:0};
  if(decision.correspondenceId!==letter.id||decision.ownerSubject!==letter.ownerSubject||
     !validMoney(decision.approvedCapCents)||!Number.isFinite(Date.parse(decision.decidedAt))||
     Date.parse(decision.decidedAt)<Date.parse(letter.receivedAt))throw new Error("Invalid fee decision");
  if(decision.decision==="decline")return {status:"declined",payableCents:0};
  if(decision.decision!=="approve")throw new Error("Invalid fee decision");
  if((letter.estimateCents as number)>decision.approvedCapCents)return {status:"above_cap",payableCents:0};
  return {status:"approved_within_cap",payableCents:letter.estimateCents!};
}

/** Deliberate allowlist: body, owner and source details never leave the private view. */
export function publicCorrespondenceSummary(letter:Correspondence):{kind:CorrespondenceKind;agencyComponentId:string;provenance:"unverified"|"reviewed"} {
  return {kind:letter.kind,agencyComponentId:letter.agencyComponentId,
    provenance:letter.verifiedBy?"reviewed":"unverified"};
}
