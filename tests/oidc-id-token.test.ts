import {generateKeyPairSync,sign} from "node:crypto";
import type {JsonWebKey} from "node:crypto";
import {describe,expect,it} from "vitest";
import {verifyOidcIdToken,IdentityError,type OidcProvider} from "../lib/auth/oidc-id-token";

const keys=generateKeyPairSync("rsa",{modulusLength:2048});
const publicJwk=keys.publicKey.export({format:"jwk"}) as JsonWebKey;
publicJwk.kid="test-key";
publicJwk.alg="RS256";
publicJwk.use="sig";
const provider:OidcProvider={issuer:"https://identity.example.gov/justice",clientId:"public-record-web"};
const nonce="test-nonce-with-adequate-entropy";
const now=1900000000;
const resolver={resolve:async(kid:string)=>{if(kid!=="test-key")throw Error("unknown key");return publicJwk;}};
function token(options:{header?:Record<string,unknown>;claims?:Record<string,unknown>;useOtherKey?:boolean}={}) {
  const header={alg:"RS256",typ:"JWT",kid:"test-key",...(options.header??{})};
  const claims={iss:provider.issuer,sub:"citizen-123",aud:provider.clientId,nonce,
    iat:now-10,exp:now+300,...(options.claims??{})};
  const h=Buffer.from(JSON.stringify(header)).toString("base64url");
  const p=Buffer.from(JSON.stringify(claims)).toString("base64url");
  const key=options.useOtherKey ? generateKeyPairSync("rsa",{modulusLength:2048}).privateKey :keys.privateKey;
  const signature=sign("RSA-SHA256",Buffer.from(h+"."+p,"ascii"),key).toString("base64url");
  return h+"."+p+"."+signature;
}
describe("OIDC identity proof - synthetic provider only",()=>{
  it("accepts a valid signed identity and does not propagate unsolicited roles",async()=>{
    const identity=await verifyOidcIdToken(token({claims:{role:"admin",email:"private@example.org"}}),
      provider,nonce,resolver,now);
    expect(identity).toEqual({issuer:provider.issuer,subject:"citizen-123",issuedAt:now-10,expiresAt:now+300});
    expect(JSON.stringify(identity)).not.toContain("admin");
    expect(JSON.stringify(identity)).not.toContain("private@example.org");
  });
  it("rejects unsigned, mismatched-algorithm, and forged tokens",async()=>{
    await expect(verifyOidcIdToken(token({header:{alg:"none"}}),provider,nonce,resolver,now)).rejects.toThrow(IdentityError);
    await expect(verifyOidcIdToken(token({useOtherKey:true}),provider,nonce,resolver,now)).rejects.toThrow(IdentityError);
    await expect(verifyOidcIdToken("eyJhbGciOiJub25lIn0.eyJzdWIiOiJyb290In0.",provider,nonce,resolver,now)).rejects.toThrow(IdentityError);
  });
  it("pins the correct issuer, audience, nonce and token age",async()=>{
    for(const claims of [
      {iss:"https://other.example.gov"}, {aud:"another-app"}, {nonce:"wrong-value"},
      {iat:now-700},{exp:now-31},{iat:now+90},
      {aud:["public-record-web","another-app"],azp:"another-app"}
    ]){
      await expect(verifyOidcIdToken(token({claims}),provider,nonce,resolver,now)).rejects.toThrow(IdentityError);
    }
  });
  it("rejects token-supplied key URLs or unsupported critical extensions",async()=>{
    await expect(verifyOidcIdToken(token({header:{jku:"https://attacker.test/keys.json"}}),
      provider,nonce,resolver,now)).rejects.toThrow(IdentityError);
    await expect(verifyOidcIdToken(token({header:{crit:["b64"]}}),
      provider,nonce,resolver,now)).rejects.toThrow(IdentityError);
  });
  it("denies unknown trusted keys and structurally invalid input",async()=>{
    await expect(verifyOidcIdToken(token({header:{kid:"missing"}}),provider,nonce,resolver,now)).rejects.toThrow(IdentityError);
    await expect(verifyOidcIdToken("incorrect",provider,nonce,resolver,now)).rejects.toThrow(IdentityError);
  });
});
