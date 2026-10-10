import {describe,it,expect,vi} from "vitest";
import {parseAgencyPage,syncFoiaAgencies,type AgencySnapshot} from "../lib/integrations/foia-gov-agencies";
const id1="8216158f-8089-431d-b866-dc334e8d4758";
const id2="1216158f-8089-431d-b866-dc334e8d4758";
const agencyId="aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
function page(ids:string[],next:string|null=null){
  return {
    data:ids.map((id,i)=>({type:"agency_component",id,
      attributes:{title:"Fictional Office "+i,abbreviation:"FO"+i},
      relationships:{agency:{data:{type:"agency",id:agencyId}}}})),
    included:[{type:"agency",id:agencyId,attributes:{name:"Fictional Agency"}}],
    links:{next}
  };
}
function cache(initial:AgencySnapshot|null=null){
  let value=initial;
  return {readLastGood:async()=>value,writeLastGood:async(v:AgencySnapshot)=>{value=v;}};
}
describe("official FOIA.gov agency components adapter",()=>{
  it("maps JSON:API with source-stamped parent agency labels",()=>{
    const result=parseAgencyPage(page([id1]),"2026-10-10T15:00:00Z");
    expect(result.records).toHaveLength(1);
    expect(result.records[0].id).toBe(id1);
    expect(result.records[0].parentAgencyId).toBe(agencyId);
    expect(result.records[0].parentAgencyName).toBe("Fictional Agency");
  });
  it("follows verified same-origin pages and retains one deduplicated snapshot",async()=>{
    const links=["https://api.foia.gov/api/agency_components?page%5Boffset%5D=1"];
    const fetcher=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
      const url=new URL(String(input));
      expect(url.origin).toBe("https://api.foia.gov");
      expect(url.pathname).toBe("/api/agency_components");
      expect((init?.headers as Record<string,string>)["X-API-Key"]).toBe("test-only-api-key");
      const body=url.searchParams.has("include")?page([id1],links[0]):page([id1,id2],null);
      return new Response(JSON.stringify(body),{status:200});
    });
    const result=await syncFoiaAgencies("test-only-api-key",cache(),fetcher as typeof fetch,"2026-10-10T15:00:00Z");
    expect(result.status).toBe("fresh");
    expect(result.records).toHaveLength(2);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("refuses external pagination and falls back only to last good records",async()=>{
    const saved:AgencySnapshot={observedAt:"2026-10-09T15:00:00Z",
      records:parseAgencyPage(page([id1]),"2026-10-09T15:00:00Z").records};
    const fetcher=vi.fn(async()=>new Response(JSON.stringify(page([id2],"https://attacker.test/hijack")),{status:200}));
    const result=await syncFoiaAgencies("key",cache(saved),fetcher as typeof fetch);
    expect(result.status).toBe("stale");
    expect(result.records.map(r=>r.id)).toEqual([id1]);
  });
  it("does not make requests without a key or invent data on outage",async()=>{
    const fetcher=vi.fn(async()=>{throw Error("offline")});
    const disabled=await syncFoiaAgencies(undefined,cache(),fetcher as typeof fetch);
    expect(disabled).toMatchObject({status:"unconfigured",records:[]});
    expect(fetcher).not.toHaveBeenCalled();
    const outage=await syncFoiaAgencies("key",cache(),fetcher as typeof fetch);
    expect(outage).toMatchObject({status:"unavailable",records:[]});
  });
  it("denies invalid component shape instead of inventing agency identifiers",()=>{
    expect(()=>parseAgencyPage(page(["bad-id"]),"2026-10-10T15:00:00Z")).toThrow();
    expect(()=>parseAgencyPage({data:[{type:"agency_component",id:id1,attributes:{}}]},"2026-10-10T15:00:00Z")).toThrow();
  });
});
