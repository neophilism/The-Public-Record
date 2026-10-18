import {generateKeyPairSync,sign} from "node:crypto";
import {describe,expect,it,vi} from "vitest";
import {completeOidcLogin,type PendingLoginStore} from "../lib/auth/oidc-exchange";

const now=1900000000;
const config={issuer:"https://login.example.gov/realm",tokenEndpoint:"https://login.example.gov/realm/token",
  redirectUri:"https://record.example.org/callback",clientId:"the-public-record"};
const state="s".repeat(43),nonce="n".repeat(43),verifier="v".repeat(43);
const {privateKey,publicKey}=generateKeyPairSync("rsa",{modulusLength:2048});
const publicJwk={...publicKey.export({format:"jwk"}),kid:"trusted"};
function token(subject="person-1") {
  const header=Buffer.from(JSON.stringify({alg:"RS256",kid:"trusted",typ:"JWT"})).toString("base64url");
  const claims=Buffer.from(JSON.stringify({iss:config.issuer,aud:config.clientId,sub:subject,
    iat:now-1,exp:now+300,nonce})).toString("base64url");
  const input=header+"."+claims;
  return input+"."+sign("RSA-SHA256",Buffer.from(input),privateKey).toString("base64url");
}
function store():PendingLoginStore {
  let used=false;
  return {consume:vi.fn(async (value:string)=>{
    if(used || value!==state)return null;
    used=true;
    return {state,nonce,codeVerifier:verifier,expiresAt:now+300};
  })};
}
const keys={resolve:async()=>publicJwk};
function response(idToken=token()) {
  return new Response(JSON.stringify({id_token:idToken}),{status:200});
}
describe("OIDC code exchange",()=>{
  it("consumes state once and sends only the configured PKCE request",async()=>{
    const fetcher=vi.fn(async (url:unknown,init:RequestInit)=>{
      expect(url).toBe(config.tokenEndpoint);
      expect(init.redirect).toBe("error");
      expect(init.credentials).toBe("omit");
      const body=init.body as URLSearchParams;
      expect(body.get("code_verifier")).toBe(verifier);
      expect(body.get("redirect_uri")).toBe(config.redirectUri);
      return response();
    });
    const deps={pending:store(),keys,fetcher:fetcher as typeof fetch,now};
    await expect(completeOidcLogin(config,state,"code-1",deps)).resolves.toMatchObject({subject:"person-1"});
    await expect(completeOidcLogin(config,state,"code-1",deps)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects forged state and a substituted provider URL before exchange",async()=>{
    const fetcher=vi.fn(async()=>response());
    await expect(completeOidcLogin(config,"x".repeat(43),"code",
      {pending:store(),keys,fetcher:fetcher as typeof fetch,now})).rejects.toThrow();
    await expect(completeOidcLogin({...config,tokenEndpoint:"https://evil.example/token"},state,"code",
      {pending:store(),keys,fetcher:fetcher as typeof fetch,now})).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects invalid ID tokens and expired state",async()=>{
    await expect(completeOidcLogin(config,state,"code",{pending:store(),keys,
      fetcher:async()=>response("forged"),now})).rejects.toThrow();
    const fetcher=vi.fn(async()=>response());
    await expect(completeOidcLogin(config,state,"code",{
      pending:{consume:async()=>({state,nonce,codeVerifier:verifier,expiresAt:now})},
      keys,fetcher:fetcher as typeof fetch,now})).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
