import {generateKeyPairSync,randomBytes,sign} from "node:crypto";
import {describe,expect,it} from "vitest";
import {beginOidcLogin} from "../lib/auth/oidc-login";
import {completeOidcLogin,type PendingLoginStore} from "../lib/auth/oidc-exchange";
import {issueSession,verifySession} from "../lib/auth/session";

const now=1900000000;
const secret=randomBytes(32).toString("base64url");
const providers=["https://identity-a.example.gov","https://identity-b.example.gov"];

function fakeProvider(issuer:string) {
  const config={issuer,authorizationEndpoint:issuer+"/authorize",
    tokenEndpoint:issuer+"/token",redirectUri:"https://record.example.org/api/auth/callback",
    clientId:"public-record"};
  const {privateKey,publicKey}=generateKeyPairSync("rsa",{modulusLength:2048});
  const jwk={...publicKey.export({format:"jwk"}),kid:"fixture-key"};
  return {config,signIdentity(nonce:string,subject:string) {
    const header=Buffer.from(JSON.stringify({alg:"RS256",kid:jwk.kid})).toString("base64url");
    const claims=Buffer.from(JSON.stringify({iss:issuer,aud:config.clientId,sub:subject,
      nonce,iat:now,exp:now+600,email:"untrusted@example.invalid",
      roles:["administrator"]})).toString("base64url");
    const body=header+"."+claims;
    return body+"."+sign("RSA-SHA256",Buffer.from(body),privateKey).toString("base64url");
  },keys:{resolve:async()=>jwk}};
}
async function login(provider:ReturnType<typeof fakeProvider>,subject:string) {
  const pending=beginOidcLogin(provider.config,now);
  let consumed=false;
  const stateStore:PendingLoginStore={async consume(state) {
    if(consumed || state!==pending.state)return null;
    consumed=true;
    return pending;
  }};
  const token=provider.signIdentity(pending.nonce,subject);
  const fetcher=async(url:RequestInfo|URL,init?:RequestInit)=>{
    expect(url).toBe(provider.config.tokenEndpoint);
    expect((init?.body as URLSearchParams).get("code_verifier")).toBe(pending.codeVerifier);
    return new Response(JSON.stringify({id_token:token}),{status:200});
  };
  const identity=await completeOidcLogin(provider.config,pending.state,"fixture-code",{
    pending:stateStore,keys:provider.keys,fetcher:fetcher as typeof fetch,now});
  await expect(completeOidcLogin(provider.config,pending.state,"fixture-code",{
    pending:stateStore,keys:provider.keys,fetcher:fetcher as typeof fetch,now})).rejects.toThrow();
  return identity;
}
describe("test-only OIDC provider contract",()=>{
  it("swaps provider without importing profile or role claims into the session",async()=>{
    for(const issuer of providers) {
      const provider=fakeProvider(issuer);
      const identity=await login(provider,"member-1");
      expect(identity).toEqual({issuer,subject:"member-1",issuedAt:now,expiresAt:now+600});
      const session=issueSession(identity,secret,now);
      expect(verifySession(session.token,secret,now+1)).toMatchObject({
        issuer,subject:"member-1"});
      expect(session.token).not.toContain("administrator");
    }
  });
  it("rejects a token signed by another configured provider",async()=>{
    const trusted=fakeProvider(providers[0]);
    const other=fakeProvider(providers[1]);
    const pending=beginOidcLogin(trusted.config,now);
    const stateStore:PendingLoginStore={consume:async()=>pending};
    const token=other.signIdentity(pending.nonce,"member-1");
    await expect(completeOidcLogin(trusted.config,pending.state,"fixture-code",{
      pending:stateStore,keys:trusted.keys,
      fetcher:(async()=>new Response(JSON.stringify({id_token:token}))) as typeof fetch,now
    })).rejects.toThrow();
  });
});
