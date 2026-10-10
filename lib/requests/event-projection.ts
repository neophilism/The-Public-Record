import {allowsEvidencedTransition,type RequestEventEvidence} from "../contracts/request-evidence";
import type {RequestState} from "../domain/request-state";

export interface RecordedTransition {
  kind:"transition";
  eventId:string;
  sequence:number;
  receivedAt:string;
  from:RequestState;
  to:RequestState;
  evidence:RequestEventEvidence;
  privateNote?:string;
  uploadedProofId?:string;
}
export interface RecordedCorrection {
  kind:"correction";
  eventId:string;
  sequence:number;
  receivedAt:string;
  correctedEventId:string;
  reason:string;
}
export type RequestLedgerEntry=RecordedTransition|RecordedCorrection;
export type ProjectionWarning="duplicate_id"|"unknown_reference"|"invalid_event"|"invalid_transition"|"conflict";
export interface RejectedEntry {eventId:string;reason:ProjectionWarning}
export interface PublicTimelineEntry {
  eventId:string;
  sequence:number;
  receivedAt:string;
  eventType:"transition"|"correction";
  state:RequestState|null;
  corrects:string|null;
  superseded:boolean;
}
export interface PublicRequestTimeline {
  state:RequestState;
  events:PublicTimelineEntry[];
  rejected:RejectedEntry[];
}
function validTimestamp(date:unknown):date is string {
  return typeof date==="string" && /^\d{4}-\d{2}-\d{2}T/.test(date) &&
    Number.isFinite(Date.parse(date));
}
function validId(id:unknown):id is string {
  return typeof id==="string" && /^[A-Za-z0-9:_-]{3,128}$/.test(id);
}
/**
 * Rebuilds a public-facing status from immutable source events. Corrections
 * preserve history but do not permit fabricated agency verification.
 * Authentication, review and append-only persistence are separate gates.
 */
export function buildRequestTimeline(entries:readonly RequestLedgerEntry[]):PublicRequestTimeline {
  if(!Array.isArray(entries)||entries.length>10000)throw Error("Request history too large");
  const ordered=[...entries].sort((a,b)=>a.sequence-b.sequence);
  const seen=new Set<string>(),rejected:RejectedEntry[]=[];
  const valid:RequestLedgerEntry[]=[];
  for(const entry of ordered){
    if(!entry || !validId(entry.eventId) || !Number.isSafeInteger(entry.sequence) ||
       entry.sequence<1 || !validTimestamp(entry.receivedAt)){
      rejected.push({eventId:entry?.eventId??"invalid",reason:"invalid_event"});continue;
    }
    if(seen.has(entry.eventId)){
      rejected.push({eventId:entry.eventId,reason:"duplicate_id"});continue;
    }
    seen.add(entry.eventId);
    valid.push(entry);
  }
  const activeTransitions=new Map<string,RecordedTransition>();
  const corrected=new Set<string>(),acceptedCorrections:RecordedCorrection[]=[];
  for(const entry of valid){
    if(entry.kind==="transition"){
      activeTransitions.set(entry.eventId,entry);
    }else if(entry.kind==="correction"){
      const target=activeTransitions.get(entry.correctedEventId);
      if(!target || target.sequence>=entry.sequence || corrected.has(target.eventId)){
        rejected.push({eventId:entry.eventId,reason:"unknown_reference"});continue;
      }
      if(typeof entry.reason!=="string" || entry.reason.trim().length<15 ||
         entry.reason.length>1000){
        rejected.push({eventId:entry.eventId,reason:"invalid_event"});continue;
      }
      corrected.add(target.eventId);acceptedCorrections.push(entry);
    }else{
      rejected.push({eventId:entry.eventId,reason:"invalid_event"});
    }
  }
  const corrections=new Set(acceptedCorrections.map(e=>e.eventId));
  let current:RequestState="unclaimed";
  const timeline:PublicTimelineEntry[]=[];
  for(const entry of valid){
    if(entry.kind==="correction"){
      if(corrections.has(entry.eventId))timeline.push({eventId:entry.eventId,
        sequence:entry.sequence,receivedAt:entry.receivedAt,eventType:"correction",
        state:null,corrects:entry.correctedEventId,superseded:false});
      continue;
    }
    if(entry.kind!=="transition")continue;
    const superseded=corrected.has(entry.eventId);
    if(superseded){
      timeline.push({eventId:entry.eventId,sequence:entry.sequence,
        receivedAt:entry.receivedAt,eventType:"transition",state:entry.to,
        corrects:null,superseded:true});continue;
    }
    if(entry.from!==current){
      rejected.push({eventId:entry.eventId,reason:"conflict"});continue;
    }
    if(!allowsEvidencedTransition(entry.from,entry.to,entry.evidence)){
      rejected.push({eventId:entry.eventId,reason:"invalid_transition"});continue;
    }
    current=entry.to;
    timeline.push({eventId:entry.eventId,sequence:entry.sequence,
      receivedAt:entry.receivedAt,eventType:"transition",state:entry.to,
      corrects:null,superseded:false});
  }
  return {state:current,events:timeline,rejected};
}
