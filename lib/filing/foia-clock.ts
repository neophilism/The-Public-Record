export interface HolidayCalendar {
  dates:readonly string[];
  verifiedThrough:string;
  sourceUrl:string;
}
export interface ClockToll {
  kind:"information"|"fee";
  startedOn:string;
  endedOn:string|null;
}
export interface RequestClockInput {
  receivedOn:string|null;
  holidays:HolidayCalendar;
  tolls:readonly ClockToll[];
  unusual?:{writtenNoticeReviewed:boolean;extraWorkingDays:number};
}
export type ClockEstimate =
  | {status:"estimated";estimatedOn:string;notice:string}
  | {status:"unknown_receipt"|"review_needed";estimatedOn:null;notice:string};

function day(value:string):Date {
  if(typeof value!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Invalid calendar day");
  const date=new Date(value+"T00:00:00Z");
  if(Number.isNaN(date.getTime()) || date.toISOString().slice(0,10)!==value)
    throw new Error("Invalid calendar day");
  return date;
}
function iso(date:Date):string {return date.toISOString().slice(0,10);}
function next(date:Date):Date {return new Date(date.getTime()+86400000);}
function weekday(date:Date,holidays:Set<string>):boolean {
  return date.getUTCDay()!==0 && date.getUTCDay()!==6 && !holidays.has(iso(date));
}
const notice="Calendar estimate only. Verify agency receipt, notices, pauses and regulations; this is not a legal violation determination.";

/** Counts only days after receipt. Holiday dates must come from a reviewed official calendar. */
export function estimateRequestClock(input:RequestClockInput):ClockEstimate {
  if(input.receivedOn===null)return {status:"unknown_receipt",estimatedOn:null,
    notice:"Agency receipt is unknown; no response date can be estimated."};
  const received=day(input.receivedOn),verifiedThrough=day(input.holidays.verifiedThrough);
  if(!/^https:\/\//.test(input.holidays.sourceUrl))throw new Error("Unverified holiday source");
  const holidays=new Set(input.holidays.dates.map(value=>iso(day(value))));
  const informationTolls=input.tolls.filter(toll=>toll.kind==="information");
  if(informationTolls.length>1 || input.tolls.some(toll=>
    !["information","fee"].includes(toll.kind) ||
    (toll.endedOn!==null && day(toll.endedOn)<day(toll.startedOn))))
    return {status:"review_needed",estimatedOn:null,notice:"Tolling record needs review; no response date is shown."};
  const pauses=input.tolls.map(toll=>({start:iso(day(toll.startedOn)),
    end:toll.endedOn===null?null:iso(day(toll.endedOn))}));
  if(pauses.some(pause=>pause.end===null))
    return {status:"review_needed",estimatedOn:null,notice:"An unresolved tolling interval prevents a reliable estimate."};
  const extension=input.unusual?.extraWorkingDays??0;
  if(!Number.isSafeInteger(extension) || extension<0 || extension>10 ||
     (extension>0 && !input.unusual?.writtenNoticeReviewed))
    return {status:"review_needed",estimatedOn:null,
      notice:"The unusual-circumstances notice or alternative timeframe needs review."};
  let current=received,count=0;
  for(let i=0;i<730;i++) {
    current=next(current);
    const value=iso(current);
    if(current>verifiedThrough)
      return {status:"review_needed",estimatedOn:null,notice:"The official holiday calendar does not cover this estimate."};
    if(weekday(current,holidays) && !pauses.some(pause=>
      value>=pause.start && value<=pause.end!))count++;
    if(count===20+extension)return {status:"estimated",estimatedOn:value,notice};
  }
  return {status:"review_needed",estimatedOn:null,notice:"The timing record needs manual review."};
}

/** A minimum statutory appeal opportunity, never the agency's actual final deadline. */
export function minimumAppealWindowEnd(adverseDeterminationOn:string):string {
  return iso(new Date(day(adverseDeterminationOn).getTime()+90*86400000));
}
