export interface SearchItem {id:string;kind:"question"|"investigation"|"file";
  title:string;agencyId?:string;publishedAt:string;sourceReviewedAt:string;
  visibility:"published"|"private";status?:string;}
export interface PublicSearchPage {items:Omit<SearchItem,"visibility">[];nextCursor:string|null;
  publishedCounts:{questions:number;investigations:number;files:number};coverageClaim:null;}

/** Server must supply published rows only; this projection repeats the privacy gate. */
export function publicSearch(items:SearchItem[],query:string,limit=20,cursor?:string):PublicSearchPage {
  if(!Number.isSafeInteger(limit)||limit<1||limit>50||query.length>200)throw new Error("Invalid search bounds");
  const published=items.filter(i=>i.visibility==="published");
  if(published.some(i=>!i.id||!i.title||!Number.isFinite(Date.parse(i.publishedAt))||
      !Number.isFinite(Date.parse(i.sourceReviewedAt))))throw new Error("Invalid public source");
  const terms=query.trim().toLocaleLowerCase();
  const matching=published.filter(i=>i.title.toLocaleLowerCase().includes(terms))
    .sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.id.localeCompare(b.id));
  const start=cursor?matching.findIndex(i=>`${i.publishedAt}:${i.id}`===cursor)+1:0;
  if(cursor&&start===0)throw new Error("Unknown search cursor");
  const selected=matching.slice(start,start+limit);
  return {items:selected.map(({visibility,...rest})=>{void visibility;return rest}),
    nextCursor:start+limit<matching.length&&selected.length?`${selected.at(-1)!.publishedAt}:${selected.at(-1)!.id}`:null,
    publishedCounts:{questions:published.filter(i=>i.kind==="question").length,
      investigations:published.filter(i=>i.kind==="investigation").length,
      files:published.filter(i=>i.kind==="file").length},coverageClaim:null};
}
