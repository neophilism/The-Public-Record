import {IdentityError} from "./oidc-id-token";

/** Enforce a byte limit while reading, including chunked or decompressed responses. */
export async function readBoundedText(response:Response,maxBytes:number):Promise<string> {
  const declared=response.headers.get("content-length");
  if(declared!==null && (!/^[0-9]+$/.test(declared) || Number(declared)>maxBytes))
    throw new IdentityError();
  if(!response.body)throw new IdentityError();
  const reader=response.body.getReader();
  const decoder=new TextDecoder("utf-8",{fatal:true});
  let total=0;
  let text="";
  try {
    while(true) {
      const chunk=await reader.read();
      if(chunk.done)break;
      total+=chunk.value.byteLength;
      if(total>maxBytes)throw new IdentityError();
      text+=decoder.decode(chunk.value,{stream:true});
    }
    text+=decoder.decode();
    return text;
  } catch {
    await reader.cancel().catch(()=>undefined);
    throw new IdentityError();
  } finally {
    reader.releaseLock();
  }
}
