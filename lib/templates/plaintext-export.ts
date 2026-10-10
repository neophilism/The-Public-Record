/** No network calls, request filing, logs or persistence in this module. */
export interface LocalRequestDraft {
  agencyName:string;
  description:string;
  startDate:string;
  endDate:string;
  feeCapUsd:number;
  electronicCopies:boolean;
}
function normalize(value:string):string {
  return value.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,"").trim();
}
function date(value:string):boolean {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const parsed=new Date(value+"T00:00:00Z");
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0,10)===value;
}
export function validateLocalDraft(draft:LocalRequestDraft):string[] {
  const errors:string[]=[];
  if(typeof draft.agencyName!=="string" || normalize(draft.agencyName).length<3 ||
     draft.agencyName.length>200 || /[\r\n]/.test(draft.agencyName))
    errors.push("Enter the official name of the federal agency after checking its instructions.");
  if(typeof draft.description!=="string" || normalize(draft.description).length<25 ||
     draft.description.length>6000)
    errors.push("Describe the existing records you wish to request, with enough detail for agency staff.");
  if(!date(draft.startDate) || !date(draft.endDate) || draft.startDate>draft.endDate)
    errors.push("Provide a valid chronological date range.");
  if(!Number.isFinite(draft.feeCapUsd) || draft.feeCapUsd<0 || draft.feeCapUsd>10000 ||
     Math.round(draft.feeCapUsd*100)!==draft.feeCapUsd*100)
    errors.push("Choose a nonnegative fee ceiling of no more than $10,000.");
  if(typeof draft.electronicCopies!=="boolean")
    errors.push("Confirm your preferred format for responsive records.");
  return errors;
}
export function renderLocalDraftText(draft:LocalRequestDraft):string {
  if(validateLocalDraft(draft).length)throw Error("Local FOIA request draft is incomplete");
  const name=normalize(draft.agencyName);
  const description=normalize(draft.description);
  const fee=draft.feeCapUsd.toFixed(2);
  const format=draft.electronicCopies?
    "I prefer responsive records to be provided in electronic format when available.":
    "Please advise me of the available formats for responsive records.";
  return [
    "FREEDOM OF INFORMATION ACT REQUEST","",
    "To: "+name,"",
    "Under the Freedom of Information Act, 5 U.S.C. § 552, I request copies of the following existing agency records:","",
    description,"",
    "Date range: "+draft.startDate+" through "+draft.endDate+".","",
    format,
    "Please notify me before incurring fees exceeding $"+fee+". This is a fee ceiling, not a claim of eligibility for a waiver.","",
    "Please let me know if any portion is withheld and identify the relevant basis for the determination.","",
    "Sincerely,",
    "[Add your name and contact information before filing under your own identity]","",
    "DRAFT ONLY — VERIFY CURRENT OFFICIAL AGENCY FILING INSTRUCTIONS BEFORE SENDING.",
    "This text was prepared locally. The Public Record did not file or transmit it."
  ].join("\n");
}
