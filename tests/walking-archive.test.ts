import {describe,it,expect} from "vitest";
import {makeArchiveSign,type ArchiveSignInput} from "../lib/public/walking-archive";
const input:ArchiveSignInput={slug:"release-1",title:"Reviewed public release",summary:"Read the original source and any corrections.",sourceSha256:"a".repeat(64),reviewStatus:"approved",privateName:"Private Name"};
describe("Walking Archive sign",()=>{
  it("prints a stable correction-aware URL without private metadata",()=>{
    const sign=makeArchiveSign({...input,correctedAt:"2026-10-18"},"https://example.gov/");
    expect(sign.qrPayload).toBe("https://example.gov/public-record/archive/release-1");
    expect(sign.printText).toContain("correction");
    expect(JSON.stringify(sign)).not.toContain("Private Name");
  });
  it("rejects unreviewed or private-name signs",()=>{
    expect(()=>makeArchiveSign({...input,reviewStatus:"pending"},"https://example.gov/")).toThrow();
    expect(()=>makeArchiveSign({...input,summary:"Private Name is here"},"https://example.gov/")).toThrow();
  });
});
