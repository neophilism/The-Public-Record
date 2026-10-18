import type {PublicArchiveAdapter} from "./foia-archive";

export interface PublicArchiveHttpConfig {endpoint:string;}

/** Read-only transport for a future explicitly configured public JSON endpoint. */
export function createPublicArchiveHttpAdapter(config:PublicArchiveHttpConfig,
  fetcher:typeof fetch=fetch):PublicArchiveAdapter {
  let endpoint:URL;
  try {endpoint=new URL(config.endpoint);} catch {throw Error("Invalid archive endpoint");}
  if(endpoint.protocol!=="https:" || endpoint.username || endpoint.password ||
     endpoint.hash || endpoint.search || endpoint.port || !endpoint.hostname.includes("."))
    throw Error("Invalid archive endpoint");
  return {async searchPublicRecords(query:string,limit:number):Promise<unknown> {
    if(typeof query!=="string" || !query.trim() || query.length>300 ||
       !Number.isSafeInteger(limit) || limit<1 || limit>100)
      throw Error("Invalid public archive query");
    const url=new URL(endpoint.href);
    url.searchParams.set("q",query.trim());
    url.searchParams.set("limit",String(limit));
    const response=await fetcher(url.href,{method:"GET",redirect:"error",cache:"no-store",
      credentials:"omit",headers:{Accept:"application/json"},signal:AbortSignal.timeout(5000)});
    const length=Number(response.headers.get("content-length")||0);
    if(!response.ok || length>262144 ||
       !/^application\/(?:[a-z0-9.+-]+\+)?json(?:;|$)/i.test(response.headers.get("content-type")||""))
      throw Error("Archive unavailable");
    const reader=response.body?.getReader();
    if(!reader)throw Error("Archive response unavailable");
    const chunks:Uint8Array[]=[];
    let bytes=0;
    while(true) {
      const part=await reader.read();
      if(part.done)break;
      bytes+=part.value.byteLength;
      if(bytes>262144) {
        await reader.cancel();
        throw Error("Archive response too large");
      }
      chunks.push(part.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  }};
}
