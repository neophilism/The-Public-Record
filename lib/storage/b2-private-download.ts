import {createHash} from "node:crypto";
import {MAX_INITIAL_QUARANTINE_BYTES} from "./quarantine-permits";
import {authorizePrivateBucket,type B2PrivateConfig,PrivateStorageError} from "./b2-private-upload";

const keyPattern=/^private\/quarantine\/v1\/[0-9a-f]{32}\/[0-9a-f-]{36}$/i;
function expectedDownloadUrl(value:unknown):URL {
  if(typeof value!=="string")throw new PrivateStorageError();
  let url:URL;
  try{url=new URL(value);}catch{throw new PrivateStorageError();}
  if(url.protocol!=="https:" || url.username || url.password || url.port || url.hash ||
     url.search || url.pathname!=="/" || !/^f[0-9]+\.backblazeb2\.com$/.test(url.hostname))
    throw new PrivateStorageError();
  return url;
}
/** Caller must authorize the user against the stored file ID/key/owner first. */
export function createB2PrivateDownloader(config:B2PrivateConfig,fetcher:typeof fetch=fetch) {
  return async function downloadPrivate(fileId:string,objectKey:string,
    expectedSha1:string,expectedBytes:number):Promise<Uint8Array> {
    if(typeof fileId!=="string" || !/^[A-Za-z0-9_-]{5,255}$/.test(fileId) ||
       !keyPattern.test(objectKey) || !/^[0-9a-f]{40}$/.test(expectedSha1) ||
       !Number.isSafeInteger(expectedBytes) || expectedBytes<1 ||
       expectedBytes>MAX_INITIAL_QUARANTINE_BYTES)
      throw new PrivateStorageError();
    const {token,storage}=await authorizePrivateBucket(config,fetcher,"readFiles");
    const base=expectedDownloadUrl(storage.downloadUrl);
    const url=new URL("/b2api/v4/b2_download_file_by_id",base);
    url.searchParams.set("fileId",fileId);
    const response=await fetcher(url.href,{method:"GET",redirect:"error",cache:"no-store",
      credentials:"omit",headers:{Authorization:token},signal:AbortSignal.timeout(10000)});
    if(!response.ok || !response.body ||
       response.headers.get("x-bz-content-sha1")!==expectedSha1 ||
       response.headers.get("content-length")!==String(expectedBytes) ||
       response.headers.get("x-bz-file-id")!==fileId)
      throw new PrivateStorageError();
    let storedName:string;
    try{storedName=decodeURIComponent(response.headers.get("x-bz-file-name")??"");}
    catch{throw new PrivateStorageError();}
    if(storedName!==objectKey)throw new PrivateStorageError();
    const chunks:Uint8Array[]=[];
    const sha1=createHash("sha1");
    let total=0;
    const reader=response.body.getReader();
    try{
      while(true){
        const part=await reader.read();
        if(part.done)break;
        total+=part.value.byteLength;
        if(total>expectedBytes)throw new PrivateStorageError();
        sha1.update(part.value);
        chunks.push(part.value);
      }
      if(total!==expectedBytes || sha1.digest("hex")!==expectedSha1)
        throw new PrivateStorageError();
      const bytes=new Uint8Array(total);
      let offset=0;
      for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      return bytes;
    }catch{await reader.cancel().catch(()=>undefined);throw new PrivateStorageError();}
    finally{reader.releaseLock();}
  };
}
