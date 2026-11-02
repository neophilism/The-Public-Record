import {readBoundedText} from "./bounded-response";
import {IdentityError,type OidcProvider,type VerifiedIdentity,type TrustedJwkResolver,verifyOidcIdToken} from "./oidc-id-token";
import {validateOidcCallbackState,type PendingOidcLogin} from "./oidc-login";

export interface PendingLoginStore {
  /** Atomically consume once; return null for missing, expired, or replayed state. */
  consume(state:string):Promise<Pick<PendingOidcLogin,"state"|"nonce"|"codeVerifier"|"expiresAt">|null>;
}
export interface OidcExchangeConfig extends OidcProvider {tokenEndpoint:string;redirectUri:string;}
export interface ExchangeDependencies {
  pending:PendingLoginStore;
  keys:TrustedJwkResolver;
  fetcher?:typeof fetch;
  now?:number;
}
function trustedUrl(value:string):URL {
  let url:URL;
  try {url=new URL(value);} catch {throw new IdentityError();}
  if(url.protocol!=="https:" || url.username || url.password || url.hash || url.port)
    throw new IdentityError();
  return url;
}
function tokenEndpoint(config:OidcExchangeConfig):URL {
  const issuer=trustedUrl(config.issuer);
  const endpoint=trustedUrl(config.tokenEndpoint);
  const redirect=trustedUrl(config.redirectUri);
  if(endpoint.origin!==issuer.origin || endpoint.search || redirect.search ||
     !config.clientId || config.clientId.length>255)throw new IdentityError();
  return endpoint;
}
/** Exchange only after trusted storage consumes state once. Caller binds transaction to the browser. */
export async function completeOidcLogin(config:OidcExchangeConfig,returnedState:unknown,code:unknown,
  deps:ExchangeDependencies):Promise<VerifiedIdentity> {
  const endpoint=tokenEndpoint(config);
  const now=deps.now??Math.floor(Date.now()/1000);
  if(typeof returnedState!=="string" || !/^[A-Za-z0-9_-]{43}$/.test(returnedState) ||
     typeof code!=="string" || !code || code.length>2048 || /[\x00-\x1f\x7f]/.test(code))
    throw new IdentityError();
  const pending=await deps.pending.consume(returnedState);
  if(!validateOidcCallbackState(returnedState,pending,now) || !pending ||
     !/^[A-Za-z0-9_-]{43}$/.test(pending.codeVerifier) ||
     !/^[A-Za-z0-9_-]{43}$/.test(pending.nonce))throw new IdentityError();
  const body=new URLSearchParams({grant_type:"authorization_code",code,
    redirect_uri:config.redirectUri,client_id:config.clientId,code_verifier:pending.codeVerifier});
  try {
    const response=await (deps.fetcher??fetch)(endpoint.href,{method:"POST",redirect:"error",
      cache:"no-store",credentials:"omit",headers:{"Content-Type":"application/x-www-form-urlencoded",
      Accept:"application/json"},body,signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw new IdentityError();
    const raw=await readBoundedText(response,32000);
    const payload=JSON.parse(raw) as unknown;
    if(!payload || typeof payload!=="object" || Array.isArray(payload) ||
       !("id_token" in payload) || typeof payload.id_token!=="string")
      throw new IdentityError();
    return await verifyOidcIdToken(payload.id_token,config,pending.nonce,deps.keys,now);
  }catch {throw new IdentityError();}
}
