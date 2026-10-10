import {createHash,randomBytes,timingSafeEqual} from "node:crypto";

export interface OidcLoginConfig {
  issuer: string;
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
}
export interface PendingOidcLogin {
  readonly state:string;
  readonly nonce:string;
  readonly codeVerifier:string;
  readonly expiresAt:number;
  readonly authorizationUrl:string;
}
function secureCompare(a:string,b:string):boolean {
  const x=Buffer.from(a,"utf8"),y=Buffer.from(b,"utf8");
  return x.length>0 && x.length===y.length && timingSafeEqual(x,y);
}
function httpsUrl(value:string):URL {
  const url=new URL(value);
  if(url.protocol!=="https:" || url.username || url.password || url.hash || url.port)
    throw Error("Untrusted OIDC URL configuration");
  return url;
}
/**
 * Public authorisation-code + PKCE S256 starter, NOT a live login endpoint.
 * Persist state/nonce/verifier in short-lived authenticated, HttpOnly
 * server-side transaction storage before redirecting a browser.
 */
export function beginOidcLogin(config:OidcLoginConfig,now=Math.floor(Date.now()/1000)):PendingOidcLogin {
  const issuer=httpsUrl(config.issuer);
  const authorization=httpsUrl(config.authorizationEndpoint);
  const redirect=httpsUrl(config.redirectUri);
  if(!config.clientId || config.clientId.length>255 ||
     authorization.origin!==issuer.origin || !redirect.pathname || authorization.search)
    throw Error("Untrusted OIDC provider configuration");
  const codeVerifier=randomBytes(32).toString("base64url");
  const state=randomBytes(32).toString("base64url");
  const nonce=randomBytes(32).toString("base64url");
  authorization.searchParams.set("response_type","code");
  authorization.searchParams.set("client_id",config.clientId);
  authorization.searchParams.set("redirect_uri",redirect.href);
  authorization.searchParams.set("scope","openid");
  authorization.searchParams.set("state",state);
  authorization.searchParams.set("nonce",nonce);
  authorization.searchParams.set("code_challenge",createHash("sha256").update(codeVerifier).digest("base64url"));
  authorization.searchParams.set("code_challenge_method","S256");
  return {state,nonce,codeVerifier,expiresAt:now+300,authorizationUrl:authorization.href};
}
export function validateOidcCallbackState(
  returnedState:unknown,
  pending:Pick<PendingOidcLogin,"state"|"expiresAt">|null,
  now=Math.floor(Date.now()/1000)
):boolean {
  return !!pending && typeof returnedState==="string" &&
    pending.expiresAt>now && pending.expiresAt<=now+300 &&
    secureCompare(returnedState,pending.state);
}
