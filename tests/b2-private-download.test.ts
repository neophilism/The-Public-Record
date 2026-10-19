import {createHash} from "node:crypto";
import {describe,expect,it,vi} from "vitest";
import {createB2PrivateDownloader} from "../lib/storage/b2-private-download";
import {PrivateStorageError} from "../lib/storage/b2-private-upload";
const config={applicationKeyId:"fixture-key-id",applicationKey:"fixture-secret",
  bucketId:"fixturebucket123"};
const key="private/quarantine/v1/"+"a".repeat(32)+"/123e4567-e89b-12d3-a456-426614174000";
const bytes=new Uint8Array([1,2,3,4]);
const sha1=createHash("sha1").update(bytes).digest("hex");
function fake(options:{bucketType?:string;name?:string;sha1?:string;
  downloadUrl?:string}={}) {
  const urls:string[]=[];
  const fetcher=vi.fn(async(url:string,init:RequestInit)=>{
    urls.push(url);
    expect(init.redirect).toBe("error");
    if(url.endsWith("b2_authorize_account"))return Response.json({
      accountId:"fixture-account",authorizationToken:"account-token",
      apiInfo:{storageApi:{apiUrl:"https://api001.backblazeb2.com",
        downloadUrl:options.downloadUrl??"https://f001.backblazeb2.com",
        allowed:{buckets:[{id:config.bucketId,name:"private-fixture"}],
          capabilities:["readFiles","listBuckets","readBucketEncryption"],
          namePrefix:"private/quarantine/v1/"}}}});
    if(url.endsWith("b2_list_buckets"))return Response.json({buckets:[{
      bucketId:config.bucketId,bucketType:options.bucketType??"allPrivate",
      defaultServerSideEncryption:{isClientAuthorizedToRead:true,
        value:{mode:"SSE-B2",algorithm:"AES256"}}}]});
    if(url.includes("b2_download_file_by_id"))return new Response(bytes,{status:200,
      headers:{"x-bz-content-sha1":options.sha1??sha1,
        "x-bz-file-name":encodeURIComponent(options.name??key),
        "x-bz-file-id":"file123","content-length":"4"}});
    throw Error("Unexpected URL");
  });
  return {fetcher:fetcher as typeof fetch,urls};
}
describe("private B2 download transport",()=>{
  it("checks private bucket, expected file identity and downloaded digest",async()=>{
    const {fetcher,urls}=fake();
    const result=await createB2PrivateDownloader(config,fetcher)("file123",key,sha1,4);
    expect(result).toEqual(bytes);
    expect(urls).toHaveLength(3);
  });
  it("rejects a public bucket or substituted download host before reading",async()=>{
    for(const options of [{bucketType:"allPublic"},
      {downloadUrl:"https://attacker.example"}]){
      const {fetcher,urls}=fake(options);
      await expect(createB2PrivateDownloader(config,fetcher)("file123",key,sha1,4))
        .rejects.toThrow(PrivateStorageError);
      expect(urls.some(url=>url.includes("b2_download_file_by_id"))).toBe(false);
    }
  });
  it("rejects wrong file name or hash and invalid input",async()=>{
    for(const options of [{name:"private/quarantine/v1/other"},
      {sha1:"0".repeat(40)}]){
      const {fetcher}=fake(options);
      await expect(createB2PrivateDownloader(config,fetcher)("file123",key,sha1,4))
        .rejects.toThrow(PrivateStorageError);
    }
    const noCall=vi.fn();
    await expect(createB2PrivateDownloader(config,noCall as typeof fetch)(
      "file123","public/asset",sha1,4)).rejects.toThrow(PrivateStorageError);
    expect(noCall).not.toHaveBeenCalled();
  });
});
