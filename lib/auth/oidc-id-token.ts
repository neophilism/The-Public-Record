import {createPublicKey, verify as cryptoVerify} from "node:crypto";
import type {JsonWebKey} from "node:crypto";

/** Only issuer-authorized, pinned RS256 signing keys are supported in v1. */
export interface OidcProvider {
  issuer: string;
  clientId: string;
}
export interface VerifiedIdentity {
  readonly issuer: string;
  readonly subject: string;
  readonly issuedAt: number;
  readonly expiresAt: number;
}
export interface TrustedJwkResolver {
  resolve(kid: string): Promise<JsonWebKey>;
}
export class IdentityError extends Error {
  constructor() { super("Identity verification failed"); this.name = "IdentityError"; }
}
function isObject(v:unknown):v is Record<string,unknown> {
  return v!==null && typeof v==="object" && !Array.isArray(v);
}
function decodePart(part:string,maxSize:number):unknown {
  if(part.length>maxSize || !/^[A-Za-z0-9_-]+$/.test(part))throw new IdentityError();
  const data=Buffer.from(part,"base64url");
  if(data.toString("base64url")!==part)throw new IdentityError();
  try{return JSON.parse(data.toString("utf8")) as unknown;}catch{throw new IdentityError();}
}
function numericDate(value:unknown):value is number {
  return typeof value==="number" && Number.isSafeInteger(value) && value>0;
}
function secureEqual(a:string,b:string):boolean {
  // Nonces are random but comparison is fixed-shape to avoid distinguishing matches.
  const x=Buffer.from(a,"utf8"),y=Buffer.from(b,"utf8");
  return x.length===y.length && x.length>0 &&
    (awaitableTimingSafeEqual(x,y));
}
import {timingSafeEqual as awaitableTimingSafeEqual} from "node:crypto";

export async function verifyOidcIdToken(
  token:unknown,
  provider:OidcProvider,
  expectedNonce:string,
  keys:TrustedJwkResolver,
  nowSeconds=Math.floor(Date.now()/1000)
):Promise<VerifiedIdentity> {
  if(typeof token!=="string" || token.length>16000 || !expectedNonce ||
     expectedNonce.length<16 || expectedNonce.length>256 ||
     !/^https:\/\/[^\s]+$/.test(provider.issuer) || !provider.clientId)
    throw new IdentityError();
  const chunks=token.split(".");
  if(chunks.length!==3 || chunks.some(c=>!c))throw new IdentityError();
  const h=decodePart(chunks[0],2048), c=decodePart(chunks[1],10000);
  if(!isObject(h) || !isObject(c) ||
    h.alg!=="RS256" || typeof h.kid!=="string" ||
    h.kid.length<1 || h.kid.length>128 ||
    (h.typ!==undefined && h.typ!=="JWT") ||
    h.crit!==undefined || h.jku!==undefined || h.x5u!==undefined)
    throw new IdentityError();
  if(c.iss!==provider.issuer || typeof c.sub!=="string" ||
     !c.sub.trim() || c.sub.length>255 || c.nonce!==expectedNonce ||
     !numericDate(c.iat) || !numericDate(c.exp))throw new IdentityError();
  const audiences = typeof c.aud==="string" ? [c.aud] : c.aud;
  if(!Array.isArray(audiences) || audiences.length===0 ||
     audiences.some(v=>typeof v!=="string") || !audiences.includes(provider.clientId) ||
     (audiences.length>1 && c.azp!==provider.clientId) ||
     (c.azp!==undefined && c.azp!==provider.clientId))throw new IdentityError();
  if(c.exp<=nowSeconds-30 || c.iat>nowSeconds+30 ||
     nowSeconds-c.iat>600 || c.exp-c.iat>1800 ||
     (c.nbf!==undefined && (!numericDate(c.nbf) || c.nbf>nowSeconds+30)) ||
     (c.auth_time!==undefined && (!numericDate(c.auth_time) || c.auth_time>nowSeconds+30)))throw new IdentityError();
  if(!secureEqual(c.nonce as string,expectedNonce))throw new IdentityError();
  try{
    const jwk=await keys.resolve(h.kid);
    if(jwk.kty!=="RSA" || jwk.kid!==h.kid ||
       (jwk.use!==undefined && jwk.use!=="sig") ||
       (jwk.alg!==undefined && jwk.alg!=="RS256") ||
       (jwk.key_ops!==undefined && (!Array.isArray(jwk.key_ops) || !jwk.key_ops.includes("verify"))) ||
       jwk.d!==undefined || jwk.p!==undefined || jwk.q!==undefined)
      throw new IdentityError();
    const key=createPublicKey({key:jwk,format:"jwk"});
    if(key.asymmetricKeyType!=="rsa" || (key.asymmetricKeyDetails?.modulusLength??0)<2048)
      throw new IdentityError();
    const raw=Buffer.from(chunks[2],"base64url");
    if(raw.toString("base64url")!==chunks[2] ||
       !cryptoVerify("RSA-SHA256",Buffer.from(chunks[0]+"."+chunks[1],"ascii"),key,raw))
      throw new IdentityError();
  }catch{throw new IdentityError();}
  return Object.freeze({issuer:provider.issuer,subject:c.sub,issuedAt:c.iat,expiresAt:c.exp});
}
