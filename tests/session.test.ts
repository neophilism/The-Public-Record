import {randomBytes} from "node:crypto";
import {describe,expect,it} from "vitest";
import {issueSession,verifySession,sessionCookie,clearSessionCookie,SESSION_COOKIE_NAME} from "../lib/auth/session";
const secret=randomBytes(32).toString("base64url");
const changed=randomBytes(32).toString("base64url");
const now=1900000000;
const identity={issuer:"https://login.example.gov",subject:"person-0123",issuedAt:now-5,expiresAt:now+3600};
describe("server-signed session tokens",()=>{
  it("limits bearer lifetime to fifteen minutes and omits PII and roles",()=>{
    const issued=issueSession(identity,secret,now);
    expect(issued.expiresAt).toBe(now+900);
    expect(verifySession(issued.token,secret,now+2)).toEqual({
      id:issued.id,issuer:issued.issuer,subject:issued.subject,
      issuedAt:issued.issuedAt,expiresAt:issued.expiresAt
    });
    expect(issued.token).not.toContain("person-0123");
    expect(verifySession(issued.token,secret,now+901)).toBeNull();
  });
  it("denies modified token contents and signing-key mismatch",()=>{
    const s=issueSession(identity,secret,now);
    const pieces=s.token.split(".");
    const modified=Buffer.from(JSON.stringify({
      v:1,iss:identity.issuer,sub:"attacker",iat:now,exp:now+900,sid:s.id
    })).toString("base64url")+"."+pieces[1];
    expect(verifySession(modified,secret,now)).toBeNull();
    expect(verifySession(s.token,changed,now)).toBeNull();
    expect(verifySession("garbage",secret,now)).toBeNull();
  });
  it("does not permit weak signing secrets or expired identity proofs",()=>{
    expect(()=>issueSession(identity,"c2hvcnQ",now)).toThrow();
    expect(()=>issueSession({...identity,expiresAt:now},secret,now)).toThrow();
  });
  it("sets exact safe cookie attributes and supports logout clearing",()=>{
    const s=issueSession(identity,secret,now);
    const header=sessionCookie(s.token);
    expect(header).toContain(SESSION_COOKIE_NAME+"=");
    expect(header).toContain("Secure;");
    expect(header).toContain("HttpOnly;");
    expect(header).toContain("SameSite=Lax;");
    expect(header).not.toContain("Domain=");
    expect(clearSessionCookie()).toContain("Max-Age=0");
  });
});
