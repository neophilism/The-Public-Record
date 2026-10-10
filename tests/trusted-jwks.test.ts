import {describe,expect,it,vi} from "vitest";
import {createTrustedJwksResolver} from "../lib/auth/trusted-jwks";
import {IdentityError} from "../lib/auth/oidc-id-token";
const config={issuer:"https://identity.example.gov/realm",
  jwksUri:"https://identity.example.gov/realm/keys"};
function valid(kid="trusted") {return {keys:[{kty:"RSA",kid,alg:"RS256",use:"sig",n:"AQAB",e:"AQAB"}]};}
describe("trusted provider keys",()=>{
  it("uses only the server's fixed JWKS URI and refuses redirects",async()=>{
    const fetcher=vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{\n      expect(input).toBe(config.jwksUri);\n      expect(init?.redirect).toBe("error");\n      return new Response(JSON.stringify(valid()),{status:200});\n    });
    const r=createTrustedJwksResolver(config,fetcher as typeof fetch);
    await r.resolve("trusted");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe(config.jwksUri);
    expect(fetcher.mock.calls[0][1]?.redirect).toBe("error");
  });
  it("denies unknown signing keys and private-key material",async()=>{
    const good=createTrustedJwksResolver(config,vi.fn(async()=>new Response(JSON.stringify(valid()),{status:200})) as typeof fetch);
    await expect(good.resolve("unknown")).rejects.toThrow(IdentityError);
    const bad=createTrustedJwksResolver(config,vi.fn(async()=>new Response(JSON.stringify({keys:[{...valid().keys[0],d:"secret"}]}),{status:200})) as typeof fetch);
    await expect(bad.resolve("trusted")).rejects.toThrow(IdentityError);
  });
  it("blocks an external-host key URL and oversized payload",async()=>{
    expect(()=>createTrustedJwksResolver({...config,jwksUri:"https://attacker.test/keys"})).toThrow(IdentityError);
    const huge=createTrustedJwksResolver(config,vi.fn(async()=>new Response("x".repeat(120001),{status:200})) as typeof fetch);
    await expect(huge.resolve("trusted")).rejects.toThrow(IdentityError);
  });
});
