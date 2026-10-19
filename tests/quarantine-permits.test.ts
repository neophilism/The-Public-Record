import {randomBytes} from "node:crypto";
import {describe,it,expect} from "vitest";
import {issueQuarantinePermit,validateQuarantinePermit,mayReadQuarantine,
 MAX_INITIAL_QUARANTINE_BYTES} from "../lib/storage/quarantine-permits";
const secret=randomBytes(32).toString("base64url");
const now=1900000000;
const identity={issuer:"https://identity.example.gov",subject:"person-A"};
const input={...identity,ownerSubject:"person-A",ownerIssuer:identity.issuer,draftId:"draft-001",
 mime:"application/pdf",bytes:1024};
describe("private object quarantine permit boundary",()=>{
 it("issues a short-lived, non-public, owner-scoped upload token",()=>{
   const permit=issueQuarantinePermit(input,secret,now);
   expect(permit.visibility).toBe("private_quarantine");
   expect(permit.objectKey).toMatch(/^private\/quarantine\/v1\/[a-f0-9]{32}\/[0-9a-f-]{36}$/);
   expect(permit.objectKey).not.toContain("person-A");
   expect(permit.expiresAt).toBe(now+300);
   expect(validateQuarantinePermit(permit.token,identity,secret,now+1)?.draftId).toBe("draft-001");
   expect(validateQuarantinePermit(permit.token,{...identity,subject:"person-B"},secret,now+1)).toBeNull();
   expect(validateQuarantinePermit(permit.token,identity,secret,now+301)).toBeNull();
 });
 it("denies cross-owner request issuance and invalid type/size",()=>{
   expect(()=>issueQuarantinePermit({...input,ownerSubject:"person-B"},secret,now)).toThrow();
   expect(()=>issueQuarantinePermit({...input,ownerIssuer:"https://other.example.gov"},secret,now)).toThrow();
   expect(()=>issueQuarantinePermit({...input,mime:"text/html"},secret,now)).toThrow();
   expect(()=>issueQuarantinePermit({...input,bytes:MAX_INITIAL_QUARANTINE_BYTES+1},secret,now)).toThrow();
   expect(()=>issueQuarantinePermit({...input,bytes:0},secret,now)).toThrow();
 });
 it("rejects altered capabilities and prevents public URL interpretation",()=>{
   const permit=issueQuarantinePermit(input,secret,now);
   const [payload,signature]=permit.token.split(".");
   const decoded=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
   const altered=Buffer.from(JSON.stringify({...decoded,bytes:4000000})).toString("base64url")+"."+signature;
   expect(validateQuarantinePermit(altered,identity,secret,now+1)).toBeNull();
   expect(validateQuarantinePermit(permit.token,{...identity,issuer:"https://other.example.gov"},secret,now+1)).toBeNull();
   expect(permit.objectKey.startsWith("https://")).toBe(false);
   expect(mayReadQuarantine({...identity,subject:"person-B"},identity,permit.objectKey)).toBe(false);
   expect(mayReadQuarantine(identity,identity,permit.objectKey)).toBe(true);
   expect(mayReadQuarantine(identity,identity,"public/records/asset")).toBe(false);
 });
 it("requires a cryptographically strong server key",()=>{
   expect(()=>issueQuarantinePermit(input,"d2Vhaw",now)).toThrow();
   expect(()=>validateQuarantinePermit("invalid",identity,"d2Vhaw",now)).toThrow();
 });
});
