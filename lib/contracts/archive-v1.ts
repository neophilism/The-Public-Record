export type ArchiveCoverage = "unknown" | "partial" | "broad_not_exhaustive";
export interface PublicRecord {
  id: string; title: string; agency: string; source_url: string; record_url: string;
  sha256: string | null; published_at: string | null;
}
export interface PublicArchiveSearchV1 {
  contract_version: "public-archive-search/v1"; source: "FOIA_Aggregator";
  observed_at: string; coverage: ArchiveCoverage; records: PublicRecord[];
}
export class ContractError extends Error { constructor() { super("Invalid public archive contract"); } }
const envelopeKeys = ["contract_version","source","observed_at","coverage","records"];
const recordKeys = ["id","title","agency","source_url","record_url","sha256","published_at"];
function isRecord(v:unknown):v is Record<string,unknown> {return v!==null && typeof v==="object" && !Array.isArray(v);}
function sameKeys(r:Record<string,unknown>,allowed:string[]):boolean {return Object.keys(r).length===allowed.length && allowed.every(k=>Object.prototype.hasOwnProperty.call(r,k));}
function text(v:unknown,max:number):v is string {return typeof v==="string" && v.trim().length>0 && v.length<=max;}
function https(v:unknown):v is string {
  if (!text(v,2048)) return false;
  try { const u = new URL(v);return u.protocol==="https:" && !u.username && !u.password && u.port==="" && u.hostname.includes(".");}
  catch{return false;}
}
function date(v:unknown):v is string {return text(v,40) && v.includes("T") && !Number.isNaN(Date.parse(v));}
export function parseArchiveSearch(input:unknown):PublicArchiveSearchV1 {
  if (!isRecord(input) || !sameKeys(input,envelopeKeys) || input.contract_version!=="public-archive-search/v1" ||
      input.source!=="FOIA_Aggregator" || !date(input.observed_at) ||
      !["unknown","partial","broad_not_exhaustive"].includes(String(input.coverage)) ||
      !Array.isArray(input.records) || input.records.length>100) throw new ContractError();
  for (const item of input.records) {
    if (!isRecord(item) || !sameKeys(item,recordKeys) || !text(item.id,120) ||
        !text(item.title,500) || !text(item.agency,250) || !https(item.source_url) ||
        !https(item.record_url) || (item.sha256!==null && !(typeof item.sha256==="string" && /^[a-f0-9]{64}$/i.test(item.sha256))) ||
        (item.published_at!==null && !date(item.published_at))) throw new ContractError();
  }
  return input as unknown as PublicArchiveSearchV1;
}
