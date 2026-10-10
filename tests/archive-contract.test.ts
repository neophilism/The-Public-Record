import {describe,it,expect,vi} from "vitest";
import {ContractError,parseArchiveSearch} from "../lib/contracts/archive-v1";
import {findPublicRecords} from "../lib/integrations/foia-archive";
function valid(){
  return {contract_version:"public-archive-search/v1",source:"FOIA_Aggregator",
    observed_at:"2026-10-10T15:00:00Z",coverage:"partial",records:[
      {id:"100",title:"Released records",agency:"Example Agency",
       source_url:"https://example.gov/foia",record_url:"https://example.gov/record/100",
       sha256:"f".repeat(64),published_at:null}
    ]};
}
describe("Public archival boundary",()=>{
  it("accepts only typed public search records",()=>{
    expect(parseArchiveSearch(valid()).records[0].id).toBe("100");
  });
  it("refuses unrecognized contract versions and extra private data",()=>{
    expect(()=>parseArchiveSearch({...valid(),contract_version:"v2"})).toThrow(ContractError);
    const sample=valid();
    expect(()=>parseArchiveSearch({...sample,records:[{...sample.records[0],requester_contact:"private"}]})).toThrow(ContractError);
    expect(()=>parseArchiveSearch({...sample,raw_private_data:[]})).toThrow(ContractError);
  });
  it("refuses insecure links, broken digests and oversized result sets",()=>{
    const sample=valid();
    expect(()=>parseArchiveSearch({...sample,records:[{...sample.records[0],record_url:"http://example.gov/records"}]})).toThrow();
    expect(()=>parseArchiveSearch({...sample,records:[{...sample.records[0],sha256:"wrong"}]})).toThrow();
    expect(()=>parseArchiveSearch({...sample,records:Array(101).fill(sample.records[0])})).toThrow();
  });
  it("distinguishes not configured, invalid contract and upstream failure",async()=>{
    expect((await findPublicRecords("logs")).state).toBe("not_configured");
    expect((await findPublicRecords("logs",{searchPublicRecords:async()=>({})})).state).toBe("incompatible_contract");
    expect((await findPublicRecords("logs",{searchPublicRecords:async()=>{throw Error("offline")}})).state).toBe("unavailable");
  });
  it("uses an injected read-only transport with bounded limits",async()=>{
    const searchPublicRecords=vi.fn().mockResolvedValue(valid());
    expect((await findPublicRecords("logs",{searchPublicRecords})).state).toBe("available");
    expect(searchPublicRecords).toHaveBeenCalledWith("logs",25);
  });
});
