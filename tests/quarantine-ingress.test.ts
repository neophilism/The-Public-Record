import {describe,it,expect} from "vitest";
import {inspectQuarantineBytes} from "./quarantine-ingress";
const clean=async()=>({verdict:"clean" as const,engine:"fixture",signatureVersion:"1"});
describe("private quarantine ingress",()=>{
  it("hashes scanned matching bytes without publishing them",async()=>{
    const r=await inspectQuarantineBytes(Buffer.from("%PDF-1.7\nfixture\n%%EOF"),"application/pdf",clean);
    expect(r.status).toBe("quarantined");
    expect(r.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it("rejects misdeclared, archive and oversize uploads",async()=>{
    await expect(inspectQuarantineBytes(Buffer.from("%PDF-1.7"),"image/png",clean)).rejects.toThrow("type");
    await expect(inspectQuarantineBytes(Buffer.from("PK\u0003\u0004zip-bomb"),"application/zip",clean)).rejects.toThrow("type");
    await expect(inspectQuarantineBytes(new Uint8Array(50*1024*1024+1),"text/plain",clean)).rejects.toThrow("size");
  });
  it("fails closed on infected, unknown and unavailable scanners",async()=>{
    const bytes=Buffer.from("Synthetic plain text");
    await expect(inspectQuarantineBytes(bytes,"text/plain",async()=>({verdict:"infected",engine:"fixture",signatureVersion:"1"}))).rejects.toThrow();
    await expect(inspectQuarantineBytes(bytes,"text/plain",async()=>({verdict:"unknown",engine:"fixture",signatureVersion:"1"}))).rejects.toThrow();
    await expect(inspectQuarantineBytes(bytes,"text/plain",()=>new Promise(()=>{}),1)).rejects.toThrow("timeout");
  });
});
