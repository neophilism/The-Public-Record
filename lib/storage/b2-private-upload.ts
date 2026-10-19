import {createHash} from "node:crypto";
import {MAX_INITIAL_QUARANTINE_BYTES} from "./quarantine-permits";

export interface B2PrivateConfig {
  applicationKeyId:string;
  applicationKey:string;
  bucketId:string;
}
export interface PrivateUploadReceipt {
  fileId:string;
  objectKey:string;
  bytes:number;
  sha256:string;
}
export class PrivateStorageError extends Error {
  constructor(){super("Private storage unavailable");this.name="PrivateStorageError";}
}
const prefix="private/quarantine/v1/";
const keyPattern=/^private\/quarantine\/v1\/[0-9a-f]{32}\/[0-9a-f-]{36}$/i;
function object(value:unknown):Record<string,unknown> {
  if(!value || typeof value!=="object" || Array.isArray(value))throw new PrivateStorageError();
  return value as Record<string,unknown>;
}
function safeUrl(value:unknown,host:(name:string)=>boolean):URL {
  if(typeof value!=="string")throw new PrivateStorageError();
  let url:URL;
  try{url=new URL(value);}catch{throw new PrivateStorageError();}
  if(url.protocol!=="https:" || url.username || url.password || url.port || url.hash ||
     !host(url.hostname))throw new PrivateStorageError();
  return url;
}
async function boundedJson(response:Response):Promise<Record<string,unknown>> {
  if(!response.ok || !response.body)throw new PrivateStorageError();
  const reader=response.body.getReader();
  const decoder=new TextDecoder("utf-8",{fatal:true});
  let total=0,text="";
  try{
    while(true){
      const part=await reader.read();
      if(part.done)break;
      total+=part.value.byteLength;
      if(total>65536)throw new PrivateStorageError();
      text+=decoder.decode(part.value,{stream:true});
    }
    text+=decoder.decode();
    return object(JSON.parse(text) as unknown);
  }catch{await reader.cancel().catch(()=>undefined);throw new PrivateStorageError();}
  finally{reader.releaseLock();}
}
function requireToken(value:unknown):string {
  if(typeof value!=="string" || !value || value.length>4096)throw new PrivateStorageError();
  return value;
}
function request(fetcher:typeof fetch,url:string,init:RequestInit):Promise<Response> {
  return fetcher(url,{...init,redirect:"error",cache:"no-store",credentials:"omit",
    signal:AbortSignal.timeout(10000)});
}
/**
 * Server-only B2 Native API v4 uploader. It returns metadata, never a public URL.
 * The caller must first verify the session, claim a one-time intent, enforce
 * durable spend limits, and scan bytes before making any object public.
 */
export function createB2PrivateUploader(config:B2PrivateConfig,fetcher:typeof fetch=fetch) {
  if(!config.applicationKeyId || !config.applicationKey ||
     !/^[A-Za-z0-9_-]{6,128}$/.test(config.bucketId))
    throw new PrivateStorageError();
  return async function uploadPrivate(objectKey:string,bytes:Uint8Array,mime:string):
    Promise<PrivateUploadReceipt> {
    if(!keyPattern.test(objectKey) || !(bytes instanceof Uint8Array) ||
       bytes.byteLength<1 || bytes.byteLength>MAX_INITIAL_QUARANTINE_BYTES ||
       !/^(application\/pdf|text\/plain|image\/(png|jpeg))$/.test(mime))
      throw new PrivateStorageError();
    const sha1=createHash("sha1").update(bytes).digest("hex");
    const sha256=createHash("sha256").update(bytes).digest("hex");
    const basic=Buffer.from(config.applicationKeyId+":"+config.applicationKey).toString("base64");
    const auth=await boundedJson(await request(fetcher,
      "https://api.backblazeb2.com/b2api/v4/b2_authorize_account",
      {method:"GET",headers:{Authorization:"Basic "+basic}}));
    const storage=object(object(auth.apiInfo).storageApi);
    const allowed=object(storage.allowed);
    const capabilities=allowed.capabilities;
    const buckets=allowed.buckets;
    if(!Array.isArray(capabilities) ||
       !["writeFiles","listBuckets","readBucketEncryption"].every(x=>capabilities.includes(x)) ||
       !Array.isArray(buckets) || buckets.length!==1 ||
       object(buckets[0]).id!==config.bucketId || allowed.namePrefix!==prefix)
      throw new PrivateStorageError();
    const api=safeUrl(storage.apiUrl,name=>/^api[0-9]+\.backblazeb2\.com$/.test(name));
    if(api.pathname!=="/" || api.search)throw new PrivateStorageError();
    const token=requireToken(auth.authorizationToken);
    const listed=await boundedJson(await request(fetcher,
      new URL("/b2api/v4/b2_list_buckets",api).href,
      {method:"POST",headers:{Authorization:token,"Content-Type":"application/json"},
       body:JSON.stringify({accountId:auth.accountId,bucketId:config.bucketId})}));
    if(!Array.isArray(listed.buckets) || listed.buckets.length!==1)
      throw new PrivateStorageError();
    const bucket=object(listed.buckets[0]);
    const encryption=object(bucket.defaultServerSideEncryption);
    const encryptionValue=object(encryption.value);
    if(bucket.bucketId!==config.bucketId || bucket.bucketType!=="allPrivate" ||
       encryption.isClientAuthorizedToRead!==true ||
       encryptionValue.mode!=="SSE-B2" || encryptionValue.algorithm!=="AES256")
      throw new PrivateStorageError();
    const uploadUrl=new URL("/b2api/v4/b2_get_upload_url",api);
    uploadUrl.searchParams.set("bucketId",config.bucketId);
    const target=await boundedJson(await request(fetcher,uploadUrl.href,
      {method:"GET",headers:{Authorization:token}}));
    if(target.bucketId!==config.bucketId)throw new PrivateStorageError();
    const upload=safeUrl(target.uploadUrl,name=>name.startsWith("pod-") &&
      name.endsWith(".backblaze.com"));
    if(!upload.pathname.startsWith("/b2api/v4/b2_upload_file"))
      throw new PrivateStorageError();
    const receipt=await boundedJson(await request(fetcher,upload.href,{
      method:"POST",headers:{Authorization:requireToken(target.authorizationToken),
        "X-Bz-File-Name":encodeURIComponent(objectKey),
        "X-Bz-Content-Sha1":sha1,"Content-Type":mime,
        "Content-Length":String(bytes.byteLength),
        "X-Bz-Server-Side-Encryption":"AES256"},
      body:bytes as unknown as BodyInit}));
    const fileId=receipt.fileId;
    const sse=object(receipt.serverSideEncryption);
    if(receipt.action!=="upload" || receipt.bucketId!==config.bucketId ||
       receipt.fileName!==objectKey || receipt.contentSha1!==sha1 ||
       Number(receipt.contentLength)!==bytes.byteLength ||
       sse.mode!=="SSE-B2" || sse.algorithm!=="AES256" ||
       typeof fileId!=="string" || !fileId)
      throw new PrivateStorageError();
    return {fileId,objectKey,bytes:bytes.byteLength,sha256};
  };
}
