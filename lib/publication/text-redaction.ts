import {createHash} from "node:crypto";
export interface RedactionRange {start:number;end:number;reason:"personal_data"|"sensitive_detail";}
export interface ReviewGate {sourceSha256:string;reviewerSubject:string;approvedAt:string;consentId:string;}
export interface TextDerivative {sourceSha256:string;derivativeSha256:string;redactedText:string;status:"reviewed_private_derivative";}
const sha=(s:string)=>createHash("sha256").update(s,"utf8").digest("hex");

/** Text-only derivative. No source bytes or removed spans appear in the returned object. */
export function redactReviewedText(source:string,ranges:RedactionRange[],gate:ReviewGate):TextDerivative {
  if(source.length<1||source.length>2_000_000||!Array.isArray(ranges)||ranges.length<1||ranges.length>1000)
    throw new Error("Invalid source or redactions");
  if(gate.sourceSha256!==sha(source)||!gate.reviewerSubject||!gate.consentId||
     !Number.isFinite(Date.parse(gate.approvedAt)))throw new Error("Review or consent missing");
  const ordered=[...ranges].sort((a,b)=>a.start-b.start);
  let cursor=0,out="";
  for(const r of ordered){
    if(!Number.isSafeInteger(r.start)||!Number.isSafeInteger(r.end)||r.start<cursor||
       r.end<=r.start||r.end>source.length||
       !["personal_data","sensitive_detail"].includes(r.reason))throw new Error("Invalid redaction range");
    out+=source.slice(cursor,r.start)+"[REDACTED]";
    cursor=r.end;
  }
  out+=source.slice(cursor);
  return {sourceSha256:gate.sourceSha256,derivativeSha256:sha(out),redactedText:out,
    status:"reviewed_private_derivative"};
}
