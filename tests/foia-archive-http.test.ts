import {describe,expect,it,vi} from "vitest";
import {createPublicArchiveHttpAdapter} from "../lib/integrations/foia-archive-http";
import {findPublicRecords} from "../lib/integrations/foia-archive";

const endpoint="https://archive.example.gov/api/public/search";
const envelope={contract_version:"public-archive-search/v1",source:"FOIA_Aggregator",
  observed_at:"2026-10-10T15:00:00Z",coverage:"partial",records:[]};
function jsonResponse(body:unknown,contentType="application/json") {
  return new Response(JSON.stringify(body),{status:200,headers:{"content-type":contentType}});
}
describe("read-only public archive transport",()=>{
  it("uses a pinned HTTPS endpoint and sends only bounded public query fields",async()=>{
    const fetcher=vi.fn(async (url:unknown,init:RequestInit)=>{
      const parsed=new URL(String(url));
      expect(parsed.origin+parsed.pathname).toBe(endpoint);
      expect([...parsed.searchParams.keys()]).toEqual(["q","limit"]);
      expect(parsed.searchParams.get("q")).toBe("released records");
      expect(parsed.searchParams.get("limit")).toBe("25");
      expect(init.method).toBe("GET");
      expect(init.credentials).toBe("omit");
      expect(init.redirect).toBe("error");
      return jsonResponse(envelope);
    });
    const adapter=createPublicArchiveHttpAdapter({endpoint},fetcher as typeof fetch);
    const result=await findPublicRecords(" released records ",adapter);
    expect(result.state).toBe("available");
    expect(result.exhaustive).toBe(false);
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it("never turns outage, HTML or invalid contract into a negative search result",async()=>{
    for(const fetcher of [async()=>{throw Error("offline")},
      async()=>jsonResponse(envelope,"text/html"),async()=>jsonResponse({records:[]})]) {
      const result=await findPublicRecords("records",
        createPublicArchiveHttpAdapter({endpoint},fetcher as typeof fetch));
      expect(result.state).not.toBe("available");
      expect(result.data).toBeNull();
      expect(result.exhaustive).toBe(false);
    }
  });
  it("rejects insecure or redirecting endpoint configuration",()=>{
    expect(()=>createPublicArchiveHttpAdapter({endpoint:"http://archive.example.gov/api"})).toThrow();
    expect(()=>createPublicArchiveHttpAdapter({endpoint:"https://user:pass@archive.example.gov/api"})).toThrow();
    expect(()=>createPublicArchiveHttpAdapter({endpoint:"https://archive.example.gov/api?q=private"})).toThrow();
  });
});
