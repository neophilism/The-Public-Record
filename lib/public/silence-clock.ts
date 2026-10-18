export interface ClockInput {
  requestDate:string;agencyReceiptDate?:string;terminalResponseAt?:string;
  asOf:string;lastVerifiedAt:string;estimatedWorkingDays?:number;
  tollingNote?:string;extensionNote?:string;
}
export interface SilenceClock {
  totalElapsedDays:number;agencyReceiptElapsedDays:number|null;
  estimatedStatutoryWorkingDays:number|null;
  stopped:boolean;stale:boolean;explanations:string[];
  legalConclusion:null;
}
const day=86_400_000;
function ms(s:string):number {const x=Date.parse(s);if(!Number.isFinite(x))throw new Error("Invalid clock date");return x;}
function elapsed(a:number,b:number):number {if(b<a)throw new Error("Clock order invalid");return Math.floor((b-a)/day);}

/** Public exhibit, not a legal deadline or wrongdoing determination. */
export function silenceClock(i:ClockInput):SilenceClock {
  const asOf=ms(i.asOf),request=ms(i.requestDate),last=ms(i.lastVerifiedAt);
  if(last>asOf||request>asOf)throw new Error("Clock order invalid");
  const end=i.terminalResponseAt?ms(i.terminalResponseAt):asOf;
  if(end>asOf||end<request)throw new Error("Clock order invalid");
  const received=i.agencyReceiptDate?ms(i.agencyReceiptDate):null;
  if(received!==null&&(received<request||received>end))throw new Error("Clock order invalid");
  if(i.estimatedWorkingDays!==undefined&&(!Number.isSafeInteger(i.estimatedWorkingDays)||i.estimatedWorkingDays<0))
    throw new Error("Invalid working-day estimate");
  const explanations=["Calendar elapsed time is separate from an agency-receipt timer and any estimated statutory working days."];
  if(received===null)explanations.push("Agency receipt date is unverified; no receipt timer is shown.");
  if(i.tollingNote)explanations.push(`Reported tolling: ${i.tollingNote}`);
  if(i.extensionNote)explanations.push(`Reported extension: ${i.extensionNote}`);
  if(i.terminalResponseAt)explanations.push("The displayed timers stop at the recorded terminal response.");
  return {totalElapsedDays:elapsed(request,end),agencyReceiptElapsedDays:received===null?null:elapsed(received,end),
    estimatedStatutoryWorkingDays:received===null?null:(i.estimatedWorkingDays??null),
    stopped:!!i.terminalResponseAt,stale:asOf-last>7*day,explanations,legalConclusion:null};
}
