import {describe,it,expect} from "vitest";
import {participationRecognition} from "../lib/public/participation-recognition";
describe("responsible participation recognition",()=>{
  it("never rewards request volume",()=>{
    const filings=Array.from({length:20},(_,i)=>({id:`f${i}`,kind:"request_filing" as const,verified:true,sourceUrl:"https://agency.gov/receipt"}));
    expect(participationRecognition(filings)).toMatchObject({eligible:false,reviewedEvidenceCount:0});
  });
  it("recognizes verified evidence with a source",()=>{
    expect(participationRecognition([{id:"s",kind:"source_review",verified:true,sourceUrl:"https://agency.gov/release"}]).reviewedEvidenceCount).toBe(1);
  });
});
