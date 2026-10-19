import {createHash} from "node:crypto";
import {describe,expect,it,vi} from "vitest";
import {createB2PrivateUploader,PrivateStorageError} from "../lib/storage/b2-private-upload";
const config={applicationKeyId:"fixture-key-id",applicationKey:"fixture-secret",
  bucketId:"fixturebucket123"};
const objectKey="private/quarantine/v1/"+"a".repeat(32)+"/123e4567-e89b-12d3-a456-426614174000";
const bytes=new Uint8Array([1,2,3,4]);
const sha1=createHash("sha1").update(bytes).digest("hex");
function responses(options:{bucketType?:string;uploadUrl?:string;receiptSha1?:string;
  namePrefix?:string}={}) {
  const calls:string[]=[];
  const fetcher=vi.fn(async(url:string,init:RequestInit)=>{
    calls.push(url);
    expect(init.redirect).toBe("error");
    expect(init.credentials).toBe("omit");
    if(url.endsWith("b2_authorize_account"))return Response.json({
      accountId:"fixture-account",authorizationToken:"account-token",
      apiInfo:{storageApi:{apiUrl:"https://api001.backblazeb2.com",
        allowed:{buckets:[{id:config.bucketId,name:"private-fixture"}],
          capabilities:["writeFiles","listBuckets","readBucketEncryption"],
          namePrefix:options.namePrefix??"private/quarantine/v1/"}}}});
    if(url.endsWith("b2_list_buckets"))return Response.json({buckets:[{
      bucketId:config.bucketId,bucketType:options.bucketType??"allPrivate",
      defaultServerSideEncryption:{isClientAuthorizedToRead:true,
        value:{mode:"SSE-B2",algorithm:"AES256"}}}]});
    if(url.includes("b2_get_upload_url"))return Response.json({
      bucketId:config.bucketId,uploadUrl:options.uploadUrl??
        "https://pod-000-1005-03.backblaze.com/b2api/v4/b2_upload_file/fixture",
      authorizationToken:"upload-token"});
    if(url.includes("b2_upload_file")) {
      expect(init.headers).toMatchObject({"Content-Length":"4",
        "X-Bz-Content-Sha1":sha1,"X-Bz-Server-Side-Encryption":"AES256"});
      return Response.json({action:"upload",bucketId:config.bucketId,
        fileName:objectKey,contentLength:4,contentSha1:options.receiptSha1??sha1,
        fileId:"file-fixture",serverSideEncryption:{mode:"SSE-B2",algorithm:"AES256"}});
    }
    throw Error("Unexpected request");
  });
  return {fetcher:fetcher as typeof fetch,calls};
}
describe("private B2 upload transport",()=>{
  it("uploads only to a verified private encrypted bucket and returns no URL",async()=>{
    const {fetcher,calls}=responses();
    const receipt=await createB2PrivateUploader(config,fetcher)(objectKey,bytes,"application/pdf");
    expect(receipt).toEqual({fileId:"file-fixture",objectKey,bytes:4,
      sha256:createHash("sha256").update(bytes).digest("hex")});
    expect(calls).toHaveLength(4);
    expect(JSON.stringify(receipt)).not.toContain("backblaze.com");
  });
  it("blocks public buckets, broad keys, and unexpected upload destinations",async()=>{
    for(const options of [{bucketType:"allPublic"},{namePrefix:""},
      {uploadUrl:"https://attacker.example/b2api/v4/b2_upload_file"}]){
      const {fetcher,calls}=responses(options);
      await expect(createB2PrivateUploader(config,fetcher)(objectKey,bytes,"application/pdf"))
        .rejects.toThrow(PrivateStorageError);
      expect(calls).not.toContain("https://attacker.example/b2api/v4/b2_upload_file");
    }
  });
  it("rejects a mismatched receipt and unsafe keys before any upload",async()=>{
    const {fetcher}=responses({receiptSha1:"0".repeat(40)});
    await expect(createB2PrivateUploader(config,fetcher)(objectKey,bytes,"application/pdf"))
      .rejects.toThrow(PrivateStorageError);
    const noCall=vi.fn();
    await expect(createB2PrivateUploader(config,noCall as typeof fetch)(
      "public/records/asset",bytes,"application/pdf")).rejects.toThrow(PrivateStorageError);
    expect(noCall).not.toHaveBeenCalled();
  });
});
