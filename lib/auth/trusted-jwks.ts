import type {JsonWebKey} from "node:crypto";
import {IdentityError,type TrustedJwkResolver} from "./oidc-id-token";

export interface TrustedJwksConfig {issuer:string;jwksUri:string;}

/**
 * A JWKS origin can only be configured by the server operator; the token
 * header is NEVER used as a URL, nor allowed to redirect the key fetch.
 */
export function createTrustedJwksResolver(config:TrustedJwksConfig,fetcher:typeof fetch=fetch):TrustedJwkResolver {
  let uri:URL, issuer:URL;
  try {
    uri=new URL(config.jwksUri);
    issuer=new URL(config.issuer);
    if(uri.protocol!=="https:" || issuer.protocol!=="https:" ||
       uri.username || uri.password || uri.port || uri.hash ||
       issuer.username || issuer.password || uri.origin!==issuer.origin)
      throw new Error("invalid");
  }catch{throw new IdentityError();}
  let keys:JsonWebKey[]=[];
  let fetchedAt=0;
  return {
    async resolve(kid:string):Promise<JsonWebKey>{
      if(!kid || kid.length>128)throw new IdentityError();
      if(Date.now()-fetchedAt>300000 || !keys.length){
        try{
          const response=await fetcher(uri.href,{
            method:"GET",redirect:"error",cache:"no-store",
            headers:{Accept:"application/json"},signal:AbortSignal.timeout(5000)
          });
          const length=Number(response.headers.get("content-length")||0);
          if(!response.ok || length>120000)throw new Error("unavailable");
          const raw=await response.text();
          if(raw.length>120000)throw new Error("oversized");
          const data=JSON.parse(raw) as unknown;
          if(typeof data!=="object" || data===null || !("keys" in data) ||
             !Array.isArray(data.keys) || data.keys.length>64)
            throw new Error("invalid keys");
          const list=data.keys as unknown[];
          keys=list.filter((value):value is JsonWebKey=>
            !!value && typeof value==="object" && !Array.isArray(value) &&
            (value as JsonWebKey).kty==="RSA" &&
            typeof (value as JsonWebKey).kid==="string" &&
            !(value as JsonWebKey).d);
          fetchedAt=Date.now();
        }catch{throw new IdentityError();}
      }
      const matching=keys.filter(key=>key.kid===kid && (key.use===undefined || key.use==="sig") &&
        (key.alg===undefined || key.alg==="RS256"));
      if(matching.length!==1)throw new IdentityError();
      return matching[0];
    }
  };
}
