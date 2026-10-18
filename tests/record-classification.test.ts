import {describe,it,expect} from "vitest";
import {classifyPrivateRecord,type ExtractionInput} from "./record-classification";
const base={mime:"application/pdf",sourceSha256:"a".repeat(64),requestId:"request-1",parserStatus:"succeeded" as const};
const page=(n:number,nativeText:string,ocrText?:string)=>({page:n,nativeText,ocrText,ocrStatus:ocrText===undefined?"not_requested" as const:"succeeded" as const});
describe("private record classification",()=>{
  it.each([
    ["native",[page(1,"Native text")]],
    ["scanned",[page(1,"","OCR text")]],
    ["mixed",[page(1,"Native"),page(2,"","OCR")]],
    ["empty",[page(1,"")]]
  ] as const)("classifies %s without public search eligibility",(kind,pages)=>{
    const result=classifyPrivateRecord({...base,pages:[...pages]});
    expect(result.kind).toBe(kind);expect(result.searchable).toBe(false);
  });
  it.each(["unsupported","failed"] as const)("retains %s as nonsearchable",parserStatus=>{
    const result=classifyPrivateRecord({...base,parserStatus,pages:[]} as ExtractionInput);
    expect(result.kind).toBe(parserStatus);expect(result.privateText).toBeNull();
  });
  it("rejects unbounded or out-of-order parser output",()=>{
    expect(()=>classifyPrivateRecord({...base,pages:[page(2,"bad")]})).toThrow();
    expect(()=>classifyPrivateRecord({...base,pages:[page(1,"x".repeat(2_000_001))]})).toThrow();
  });
});
