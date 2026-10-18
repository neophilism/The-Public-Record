import {ContractError,parseArchiveSearch,type PublicArchiveSearchV1} from "../contracts/archive-v1";

export interface PublicArchiveAdapter {
  searchPublicRecords(query: string, limit: number): Promise<unknown>;
}
export type LookupResult =
  | {state:"available";data:PublicArchiveSearchV1;exhaustive:false}
  | {state:"not_configured"|"unavailable"|"incompatible_contract";data:null;exhaustive:false};

/**
 * This contract adapter deliberately has no outbound HTTP client yet:
 * the upstream FOIA Aggregator only exposes HTML browse pages today.
 */
export async function findPublicRecords(query:string,adapter?:PublicArchiveAdapter):Promise<LookupResult>{
  if (!adapter) return {state:"not_configured",data:null,exhaustive:false};
  if(typeof query!=="string" || !query.trim() || query.length>300)
    return {state:"incompatible_contract",data:null,exhaustive:false};
  try {
    return {state:"available",data:parseArchiveSearch(await adapter.searchPublicRecords(query,25)),exhaustive:false};
  }catch(error){
    return {state:error instanceof ContractError?"incompatible_contract":"unavailable",data:null,exhaustive:false};
  }
}
