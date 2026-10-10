/** Static drafting safeguards are informational; they do not constitute legal advice. */
export type LintCode =
  "agency_unverified"|"agency_mismatch"|"no_records_sought"|"unreasonable_fee_cap"|
  "unsupported_fee_waiver"|"missing_electronic_preference"|"invalid_date_range"|
  "unbounded_date_range"|"possibly_overbroad"|"only_questions"|"missing_source";
export interface LintIssue {code:LintCode;severity:"error"|"warning";message:string}
export interface DraftContext {
  selectedAgencyComponentId:string;
  verifiedAgencyComponentId:string|null;
  officialAgencyChannelVerified:boolean;
  description:string;
  startDate:string|null;
  endDate:string|null;
  feeCapUsd:number|null;
  feeWaiverRequested:boolean;
  feeWaiverExplanation:string|null;
  electronicDeliveryRequested:boolean;
  documentedSourceIds:readonly string[];
}
const component=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function date(value:string|null):boolean {
  if(value===null)return true;
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const n=new Date(value+"T00:00:00Z");
  return Number.isFinite(n.valueOf()) && n.toISOString().slice(0,10)===value;
}
function issue(code:LintCode,severity:LintIssue["severity"],message:string):LintIssue {
  return {code,severity,message};
}
export function lintFoiaDraft(draft:DraftContext):LintIssue[] {
  if(!draft || typeof draft.description!=="string")throw Error("Invalid private request draft");
  const output:LintIssue[]=[];
  if(!draft.officialAgencyChannelVerified || !component.test(draft.selectedAgencyComponentId))
    output.push(issue("agency_unverified","error","Verify the official federal agency component and filing destination"));
  if(draft.verifiedAgencyComponentId!==draft.selectedAgencyComponentId)
    output.push(issue("agency_mismatch","error","Draft and verified agency component do not match"));
  const description=draft.description.trim();
  const records=/\b(records?|documents?|memorand(?:um|a)|emails?|correspondence|contracts?|logs?|reports?|minutes|invoices?|datasets?|spreadsheets?|polic(?:y|ies))\b/i;
  if(description.length<25 || description.length>6000 || !records.test(description))
    output.push(issue("no_records_sought","error","Describe identifiable existing agency records"));
  if(/^(why|how|when|who|what)\b/i.test(description) && /\?\s*$/.test(description))
    output.push(issue("only_questions","warning","FOIA generally requests existing records, not explanations"));
  if(!date(draft.startDate)||!date(draft.endDate) ||
     (draft.startDate!==null && draft.endDate!==null && draft.startDate>draft.endDate))
    output.push(issue("invalid_date_range","error","Specify a valid chronological date range"));
  if(draft.startDate===null || draft.endDate===null)
    output.push(issue("unbounded_date_range","warning","A bounded date range can improve processing"));
  if(/\ball\s+(?:records|documents|information)\s+(?:ever|about\s+everything|on\s+every\s+topic)\b/i.test(description)||
     /\bany\s+and\s+all\s+records\b/i.test(description))
    output.push(issue("possibly_overbroad","warning","Consider describing narrower record categories and time limits"));
  if(draft.feeCapUsd===null || !Number.isFinite(draft.feeCapUsd) ||
     draft.feeCapUsd<0 || draft.feeCapUsd>10000)
    output.push(issue("unreasonable_fee_cap","error","Choose a truthful nonnegative fee ceiling up to the configured limit"));
  if(draft.feeWaiverRequested &&
     (typeof draft.feeWaiverExplanation!=="string" || draft.feeWaiverExplanation.trim().length<80))
    output.push(issue("unsupported_fee_waiver","error","Explain the genuine grounds for your optional fee-waiver request"));
  if(!draft.electronicDeliveryRequested)
    output.push(issue("missing_electronic_preference","warning","Consider explicitly requesting electronic copies"));
  if(!Array.isArray(draft.documentedSourceIds)||draft.documentedSourceIds.length===0)
    output.push(issue("missing_source","warning","Add documentary context or explain why no prior source is available"));
  return output;
}
export interface LintOverride {code:LintCode;reason:string;actorSubject:string;recordedAt:string}
export function checkReadyForExport(
  issues:readonly LintIssue[],overrides:readonly LintOverride[]
):{ready:boolean;unresolved:LintIssue[];recorded:LintOverride[]} {
  const byCode=new Map<LintCode,LintOverride>();
  for(const override of overrides){
    if(!override || typeof override.actorSubject!=="string" ||
       !override.actorSubject.trim() || !override.reason ||
       override.reason.trim().length<20 || override.reason.length>1000 ||
       !Number.isFinite(Date.parse(override.recordedAt)) ||
       byCode.has(override.code))throw Error("Invalid override audit");
    byCode.set(override.code,override);
  }
  const unresolved=issues.filter(i=>i.severity==="error"||!byCode.has(i.code));
  return {ready:unresolved.length===0,unresolved,recorded:overrides.filter(o=>issues.some(i=>i.code===o.code&&i.severity==="warning"))};
}
