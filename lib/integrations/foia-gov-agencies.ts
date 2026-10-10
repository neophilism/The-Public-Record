/**
 * FOIA.gov's official public Agency Components JSON:API.
 * Docs: https://www.foia.gov/developer/
 *
 * Server-only: never send FOIA_API_KEY to a browser or log upstream bodies.
 */
const API="https://api.foia.gov/api/agency_components";
export interface AgencyComponent {
  id:string;
  name:string;
  abbreviation:string|null;
  parentAgencyId:string|null;
  parentAgencyName:string|null;
  observedAt:string;
}
export interface AgencySnapshot {observedAt:string;records:AgencyComponent[]}
export type AgencySyncResult =
  | {status:"fresh"|"stale";records:AgencyComponent[];observedAt:string}
  | {status:"unconfigured"|"unavailable";records:[];observedAt:null};
export interface AgencyCache {
  readLastGood():Promise<AgencySnapshot|null>;
  writeLastGood(snapshot:AgencySnapshot):Promise<void>;
}
export class AgencyApiError extends Error {
  constructor() {super("FOIA agency directory temporarily unavailable");this.name="AgencyApiError";}
}
function obj(value:unknown):Record<string,unknown> {
  if(!value || typeof value!=="object" || Array.isArray(value))throw new AgencyApiError();
  return value as Record<string,unknown>;
}
function uuid(value:unknown):value is string {
  return typeof value==="string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
function text(value:unknown,max:number):value is string {
  return typeof value==="string" && !!value.trim() && value.length<=max;
}
function nextUrl(raw:unknown):string|null {
  if(raw===null || raw===undefined)return null;
  const value=typeof raw==="string" ? raw:obj(raw).href;
  if(typeof value!=="string" || value.length>4096)throw new AgencyApiError();
  let url:URL;
  try{url=new URL(value,API);}catch{throw new AgencyApiError();}
  if(url.protocol!=="https:" || url.hostname!=="api.foia.gov" || url.port ||
     url.username || url.password || url.hash ||
     url.pathname!=="/api/agency_components")throw new AgencyApiError();
  return url.href;
}
export function parseAgencyPage(body:unknown,observedAt:string):{records:AgencyComponent[];next:string|null} {
  const root=obj(body);
  if(!Array.isArray(root.data) || root.data.length>1000)throw new AgencyApiError();
  const included=Array.isArray(root.included)?root.included:[];
  if(included.length>1000)throw new AgencyApiError();
  const agencyNames=new Map<string,string>();
  for(const item of included){
    const a=obj(item);
    if(a.type!=="agency" || !uuid(a.id))continue;
    const attributes=obj(a.attributes);
    if(text(attributes.name,250))agencyNames.set(a.id,attributes.name);
  }
  const records=root.data.map((item):AgencyComponent=>{
    const row=obj(item);
    if(row.type!=="agency_component" || !uuid(row.id))throw new AgencyApiError();
    const attributes=obj(row.attributes);
    if(!text(attributes.title,250))throw new AgencyApiError();
    const abbreviation=attributes.abbreviation;
    if(abbreviation!==null && abbreviation!==undefined && !text(abbreviation,80))throw new AgencyApiError();
    let parentAgencyId:string|null=null;
    if(row.relationships!==null && row.relationships!==undefined){
      const relationships=obj(row.relationships);
      if(relationships.agency!==undefined){
        const agency=obj(relationships.agency);
        if(agency.data!==null && agency.data!==undefined){
          const target=obj(agency.data);
          if(target.type!=="agency" || !uuid(target.id))throw new AgencyApiError();
          parentAgencyId=target.id;
        }
      }
    }
    return {id:row.id,name:attributes.title,abbreviation:abbreviation??null,
      parentAgencyId,parentAgencyName:parentAgencyId?agencyNames.get(parentAgencyId)??null:null,
      observedAt};
  });
  const links=root.links===undefined ?{}:obj(root.links);
  return {records,next:nextUrl(links.next)};
}
function firstUrl(){
  const url=new URL(API);
  url.searchParams.set("include","agency");
  url.searchParams.set("fields[agency_component]","title,abbreviation,agency");
  url.searchParams.set("fields[agency]","name,abbreviation");
  return url.href;
}
export async function syncFoiaAgencies(
  apiKey:string|undefined,
  cache:AgencyCache,
  fetcher:typeof fetch=fetch,
  observedAt=new Date().toISOString()
):Promise<AgencySyncResult>{
  if(!apiKey?.trim())return {status:"unconfigured",records:[],observedAt:null};
  const all=new Map<string,AgencyComponent>(), visited=new Set<string>();
  let url:string|null=firstUrl();
  try {
    for(let page=0;url!==null && page<100;page++){
      if(visited.has(url))throw new AgencyApiError();
      visited.add(url);
      let response:Response|null=null;
      for(let attempt=0;attempt<3;attempt++){
        try {
          response=await fetcher(url,{method:"GET",redirect:"error",
            headers:{Accept:"application/vnd.api+json","X-API-Key":apiKey},
            signal:AbortSignal.timeout(10000)});
          if(response.ok)break;
          if(![429,500,502,503,504].includes(response.status))throw new AgencyApiError();
        }catch{response=null;}
      }
      if(!response?.ok)throw new AgencyApiError();
      if(Number(response.headers.get("content-length")||0)>2000000)throw new AgencyApiError();
      const raw=await response.text();
      if(raw.length>2000000)throw new AgencyApiError();
      const parsed=parseAgencyPage(JSON.parse(raw) as unknown,observedAt);
      for(const item of parsed.records){
        if(all.size>=5000 && !all.has(item.id))throw new AgencyApiError();
        all.set(item.id,item);
      }
      url=parsed.next;
    }
    if(url!==null || all.size===0)throw new AgencyApiError();
    const snapshot={observedAt,records:[...all.values()]};
    await cache.writeLastGood(snapshot);
    return {status:"fresh",...snapshot};
  }catch{
    try{
      const previous=await cache.readLastGood();
      if(previous && previous.records.length>0)
        return {status:"stale",...previous};
    }catch{/* no cached data */}
    return {status:"unavailable",records:[],observedAt:null};
  }
}
