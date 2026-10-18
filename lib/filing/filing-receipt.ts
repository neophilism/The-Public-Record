import {createHash,timingSafeEqual} from "node:crypto";

export interface ParticipantFilingReport {
  draftId:string;
  filedOn:string;
  caseNumber:string|null;
  proofSha256:string|null;
  confirmation:"participant_reported_unverified";
}
function record(v:unknown):v is Record<string,unknown> {
  return !!v && typeof v==="object" && !Array.isArray(v);
}
function validDay(v:unknown):v is string {
  return typeof v==="string" && /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v;
}
/** Only participant-report fields are accepted; no client confirmation flag exists. */
export function parseParticipantFilingReport(input:unknown,
  now=new Date()):ParticipantFilingReport {
  if(!record(input) || Object.keys(input).some(key=>
    !["draftId","filedOn","caseNumber","proofSha256"].includes(key)) ||
    typeof input.draftId!=="string" || !/^[A-Za-z0-9_-]{3,128}$/.test(input.draftId) ||
    !validDay(input.filedOn) || input.filedOn>now.toISOString().slice(0,10) ||
    !(input.caseNumber===null || input.caseNumber===undefined ||
      (typeof input.caseNumber==="string" && input.caseNumber.trim().length>0 &&
       input.caseNumber.length<=120 && !/[\x00-\x1f\x7f]/.test(input.caseNumber))) ||
    !(input.proofSha256===null || input.proofSha256===undefined ||
      (typeof input.proofSha256==="string" && /^[a-f0-9]{64}$/i.test(input.proofSha256))))
    throw new Error("Invalid participant filing report");
  return {draftId:input.draftId,filedOn:input.filedOn,
    caseNumber:typeof input.caseNumber==="string"?input.caseNumber:null,
    proofSha256:typeof input.proofSha256==="string"?input.proofSha256.toLowerCase():null,
    confirmation:"participant_reported_unverified"};
}

/** Compare retained proof bytes against the recorded digest without exposing them. */
export function proofMatchesDigest(bytes:Uint8Array,expectedSha256:unknown):boolean {
  if(!(bytes instanceof Uint8Array) || typeof expectedSha256!=="string" ||
     !/^[a-f0-9]{64}$/i.test(expectedSha256))return false;
  const actual=createHash("sha256").update(bytes).digest();
  const expected=Buffer.from(expectedSha256,"hex");
  return timingSafeEqual(actual,expected);
}
