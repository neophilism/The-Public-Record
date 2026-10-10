import {createHmac,randomUUID,timingSafeEqual} from "node:crypto";

const ALLOWED_TYPES=new Set([
  "application/pdf","text/plain","image/png","image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
export const MAX_INITIAL_QUARANTINE_BYTES=50*1024*1024;
type PrivatePermit = {
  v:1;subTag:string;draftId:string;objectKey:string;mime:string;
  bytes:number;issuedAt:number;expiresAt:number;nonce:string;
};
export interface UploadPermit {
  token:string;objectKey:string;expiresAt:number;visibility:"private_quarantine";
}
function keyMaterial(secret:string):Buffer {
  if(typeof secret!=="string" || !/^[A-Za-z0-9_-]+$/.test(secret))
    throw Error("Quarantine capability key required");
  const key=Buffer.from(secret,"base64url");
  if(key.length<32 || key.toString("base64url")!==secret)
    throw Error("Quarantine capability key required");
  return key;
}
function sign(input:string,key:Buffer):Buffer {
  return createHmac("sha256",key).update(input).digest();
}
function subjectTag(subject:string,key:Buffer):string {
  return createHmac("sha256",key).update("subject-v1:").update(subject).digest("hex").slice(0,32);
}
const idRe=/^[A-Za-z0-9_-]{3,128}$/;
export function issueQuarantinePermit(
  request:{subject:string;ownerSubject:string;draftId:string;mime:string;bytes:number},
  secret:string,
  now=Math.floor(Date.now()/1000)
):UploadPermit {
  const key=keyMaterial(secret);
  if(typeof request.subject!=="string" || !request.subject ||
     request.subject!==request.ownerSubject || request.subject.length>255 ||
     typeof request.draftId!=="string" || !idRe.test(request.draftId) ||
     !ALLOWED_TYPES.has(request.mime) || !Number.isSafeInteger(request.bytes) ||
     request.bytes<1 || request.bytes>MAX_INITIAL_QUARANTINE_BYTES)
    throw Error("Quarantine upload not authorized");
  const subTag=subjectTag(request.subject,key);
  const objectKey=`private/quarantine/v1/${subTag}/${randomUUID()}`;
  const item:PrivatePermit={v:1,subTag,draftId:request.draftId,objectKey,
    mime:request.mime,bytes:request.bytes,issuedAt:now,expiresAt:now+300,
    nonce:randomUUID()};
  const body=Buffer.from(JSON.stringify(item)).toString("base64url");
  const token=body+"."+sign(body,key).toString("base64url");
  return {token,objectKey,expiresAt:item.expiresAt,visibility:"private_quarantine"};
}
export function validateQuarantinePermit(
  token:unknown,
  verifiedSubject:string,
  secret:string,
  now=Math.floor(Date.now()/1000)
):Omit<PrivatePermit,"subTag">|null {
  const key=keyMaterial(secret);
  if(typeof token!=="string" || token.length>1800 ||
     !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ||
     !verifiedSubject || verifiedSubject.length>255)return null;
  const [body,signature]=token.split(".");
  const received=Buffer.from(signature,"base64url");
  const expected=sign(body,key);
  if(received.length!==expected.length || !timingSafeEqual(received,expected))return null;
  try {
    const raw=Buffer.from(body,"base64url");
    if(raw.toString("base64url")!==body)return null;
    const p=JSON.parse(raw.toString("utf8")) as PrivatePermit;
    if(p.v!==1 || !Number.isSafeInteger(p.issuedAt) ||
       !Number.isSafeInteger(p.expiresAt) || p.issuedAt>now+30 ||
       p.expiresAt<=now || p.expiresAt-p.issuedAt!==300 ||
       !idRe.test(p.draftId) || !ALLOWED_TYPES.has(p.mime) ||
       !Number.isSafeInteger(p.bytes) || p.bytes<1 ||
       p.bytes>MAX_INITIAL_QUARANTINE_BYTES ||
       p.subTag!==subjectTag(verifiedSubject,key) ||
       !new RegExp("^private/quarantine/v1/"+p.subTag+"/[0-9a-f-]{36}$","i").test(p.objectKey) ||
       !/^[0-9a-f-]{36}$/i.test(p.nonce) ||
       Object.keys(p).sort().join(",")!=="bytes,draftId,expiresAt,issuedAt,mime,nonce,objectKey,subTag,v")
      return null;
    const {subTag, ...details}=p;
    void subTag;
    return details;
  }catch{return null;}
}
/** Private downloads are authorized against server-owned owner metadata. */
export function mayReadQuarantine(subject:string|null,storedOwner:string,objectKey:string):boolean {
  return typeof subject==="string" && subject.trim().length>0 && subject===storedOwner &&
    /^private\/quarantine\/v1\/[0-9a-f]{32}\/[0-9a-f-]{36}$/i.test(objectKey);
}

/** No interface method creates a public URL or bypasses server-side content scanning. */
export interface PrivateQuarantineAdapter {
  writePrivateObject(key:string,contents:Uint8Array):Promise<void>;
  readPrivateObject(key:string):Promise<Uint8Array>;
  deletePrivateObject(key:string):Promise<void>;
}
