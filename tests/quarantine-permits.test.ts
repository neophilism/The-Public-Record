import {randomBytes} from "node:crypto";
import {describe,it,expect} from "vitest";
import {issueQuarantinePermit,validateQuarantinePermit,mayReadQuarantine,
 MAX_INITIAL_QUARANTINE_BYTES} from "../lib/storage/quarantine-permits";
const secret=randomBytes(32).toString("base64url");
const now=1900000000;
const input={subject:"person-A",ownerSubject:"person-A",draftId:"draft-001",
 mime:"application/pdf",bytes:1024};
describe("private object quarantine permit boundary",()=>{
 it("issues a short-lived, non-public, owner-scoped upload token",()=>{
   const permit=issueQuarantinePermit(input,secret,now);
   expect(permit.visibility).toBe("private_quarantine");
   expect(permit.objectKey).toMatch(/^private\/quarantine\/v1\/[a-f0-9]{32}\/[0-9a-f-]{36}$/);
   expect(permit.objectKey).not.toContain("person-A");
   expect(permit.expiresAt).toBe(now+300);
   expect(validateQuarantinePermit(permit.token,"person-A",secret,now+1)?.draftId).toBe("draft-001");
   expect(validateQuarantinePermit(permit.token,"person-B",secret,now+1)).toBeNull();
   expect(validateQuarantinePermit(permit.token,"person-A",secret,now+301)).toBeNull();
 });
 it("denies cross-owner request issuance and invalid type/size",()=>{
   expect(()=>issueQuarantinePermit({...input,ownerSubject:"person-B"},secret,now)).toThrow();
   expect(()=>issueQuarantinePermit({...input,mime:"text/html"},secret,now)).toThrow();
   expect(()=>issueQuarantinePermit({...input,bytes:MAX_INITIAL_QUARANTINE_BYTES+1},secret,now)).toThrow();
   expect(()=>issueQuarantinePermit({...input,bytes:0},secret,now)).toThrow();
 });
 it("rejects altered capabilities and prevents public URL interpretation",()=>{
   const permit=issueQuarantinePermit(input,secret,now);
   const [payload,signature]=permit.token.split(".");
   const decoded=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
   const altered=Buffer.from(JSON.stringify({...decoded,bytes:4000000})).toString("base64url")+"."+signature;
   expect(validateQuarantinePermit(altered,"person-A",secret,now+1)).toBeNull();
   expect(permit.objectKey.startsWith("https://")).toBe(false);
   expect(mayReadQuarantine("person-B","person-A",permit.objectKey)).toBe(false);
   expect(mayReadQuarantine("person-A","person-A",permit.objectKey)).toBe(true);
   expect(mayReadQuarantine("person-A","person-A","public/records/asset")).toBe(false);
 });
 it("requires a cryptographically strong server key",()=>{
   expect(()=>issueQuarantinePermit(input,"d2Vhaw",now)).toThrow();
   expect(()=>validateQuarantinePermit("invalid","person-A","d2Vhaw",now)).toThrow();
 });
});
