import {createHmac,randomBytes,timingSafeEqual} from "node:crypto";
import type {VerifiedIdentity} from "./oidc-id-token";

export const SESSION_COOKIE_NAME="__Host-tpr_session";
export interface ValidSession {
  readonly issuer:string;
  readonly subject:string;
  readonly issuedAt:number;
  readonly expiresAt:number;
  readonly id:string;
}
function signingKey(secretBase64url:string):Buffer {
  if(typeof secretBase64url!=="string" || !/^[A-Za-z0-9_-]+$/.test(secretBase64url))
    throw new Error("Session signing key not configured");
  const key=Buffer.from(secretBase64url,"base64url");
  if(key.length<32 || key.toString("base64url")!==secretBase64url)
    throw new Error("Session signing key not configured");
  return key;
}
function mac(input:string,key:Buffer):Buffer {
  return createHmac("sha256",key).update(input).digest();
}
export function issueSession(identity:VerifiedIdentity,secret:string,now=Math.floor(Date.now()/1000)):ValidSession & {token:string} {
  const key=signingKey(secret);
  if(typeof identity?.subject!=="string" || !identity.subject || identity.subject.length>255 ||
     typeof identity.issuer!=="string" || !identity.issuer.startsWith("https://") ||
     !Number.isSafeInteger(identity.expiresAt) || identity.expiresAt<=now ||
     !Number.isSafeInteger(identity.issuedAt) || identity.issuedAt>now+30)
    throw new Error("Unverified identity cannot create a session");
  const data={v:1,iss:identity.issuer,sub:identity.subject,iat:now,
    exp:Math.min(identity.expiresAt,now+900),sid:randomBytes(16).toString("base64url")};
  const body=Buffer.from(JSON.stringify(data)).toString("base64url");
  const token=body+"."+mac(body,key).toString("base64url");
  return {issuer:data.iss,subject:data.sub,issuedAt:data.iat,expiresAt:data.exp,id:data.sid,token};
}
export function verifySession(raw:unknown,secret:string,now=Math.floor(Date.now()/1000)):ValidSession|null {
  const key=signingKey(secret);
  if(typeof raw!=="string" || raw.length>2500 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(raw))
    return null;
  const [body,signature]=raw.split(".");
  const received=Buffer.from(signature,"base64url");
  const expected=mac(body,key);
  if(received.length!==expected.length || !timingSafeEqual(received,expected))return null;
  try {
    const obj=JSON.parse(Buffer.from(body,"base64url").toString("utf8")) as Record<string,unknown>;
    if(obj.v!==1 || typeof obj.iss!=="string" || !obj.iss.startsWith("https://") ||
       typeof obj.sub!=="string" || !obj.sub || obj.sub.length>255 ||
       typeof obj.sid!=="string" || !/^[A-Za-z0-9_-]{20,30}$/.test(obj.sid) ||
       typeof obj.iat!=="number" || !Number.isSafeInteger(obj.iat) ||
       typeof obj.exp!=="number" || !Number.isSafeInteger(obj.exp) ||
       obj.exp<=now || obj.iat>now+30 || obj.exp-obj.iat>900 ||
       Object.keys(obj).sort().join(",")!=="exp,iat,iss,sid,sub,v")
      return null;
    return {issuer:obj.iss,subject:obj.sub,issuedAt:obj.iat,expiresAt:obj.exp,id:obj.sid};
  }catch{return null;}
}
export function sessionCookie(token:string,maxAgeSeconds=900):string {
  if(!token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ||
     !Number.isInteger(maxAgeSeconds) || maxAgeSeconds<1 || maxAgeSeconds>900)
    throw Error("Invalid secure session cookie");
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}
export function clearSessionCookie():string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
