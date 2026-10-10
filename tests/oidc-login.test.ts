import {describe,expect,it} from "vitest";
import {beginOidcLogin,validateOidcCallbackState} from "../lib/auth/oidc-login";
const config={issuer:"https://login.example.gov/realm",
 authorizationEndpoint:"https://login.example.gov/realm/authorize",
 clientId:"the-public-record",redirectUri:"https://public-record.example.org/oidc/callback"};
describe("OIDC authorization code entry",()=>{
 it("creates independently randomized PKCE, state and nonce for each login",()=>{
   const one=beginOidcLogin(config,1900000000);
   const two=beginOidcLogin(config,1900000000);
   const u=new URL(one.authorizationUrl);
   expect(u.searchParams.get("response_type")).toBe("code");
   expect(u.searchParams.get("code_challenge_method")).toBe("S256");
   expect(u.searchParams.get("scope")).toBe("openid");
   expect(u.searchParams.get("nonce")).toBe(one.nonce);
   expect(one.state).not.toBe(two.state);
   expect(one.codeVerifier).not.toBe(two.codeVerifier);
   expect(one.expiresAt).toBe(1900000300);
 });
 it("rejects forged, missing and expired state",()=>{
   const x=beginOidcLogin(config,1900000000);
   expect(validateOidcCallbackState(x.state,x,1900000010)).toBe(true);
   expect(validateOidcCallbackState("mismatch",x,1900000010)).toBe(false);
   expect(validateOidcCallbackState(x.state,x,1900000300)).toBe(false);
   expect(validateOidcCallbackState(x.state,null,1900000010)).toBe(false);
 });
 it("rejects untrusted OIDC endpoints and insecure redirects",()=>{
   expect(()=>beginOidcLogin({...config,authorizationEndpoint:"https://attacker.test/auth"},1900000000)).toThrow();
   expect(()=>beginOidcLogin({...config,redirectUri:"http://localhost:3000/callback"},1900000000)).toThrow();
   expect(()=>beginOidcLogin({...config,authorizationEndpoint:"http://login.example.gov/auth"},1900000000)).toThrow();
 });
});
