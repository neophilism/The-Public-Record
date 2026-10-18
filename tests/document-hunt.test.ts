import {describe,it,expect} from "vitest";
import {scoreDocumentHunt,type HuntClue,type SourceVisit} from "../lib/public/document-hunt";
const clue:HuntClue={id:"c1",sourceId:"release-1",sourceVersion:"v1",sourceSha256:"a".repeat(64),sourceUrl:"https://agency.gov/release",prompt:"Find the cited release."};
const visit:SourceVisit={clueId:"c1",sourceId:"release-1",sourceVersion:"v1",sourceSha256:"a".repeat(64),visitedUrl:"https://agency.gov/release",answerVerified:true};
describe("Document Hunts",()=>{
  it("requires exact source navigation for completion",()=>{
    expect(scoreDocumentHunt([clue],[visit])).toMatchObject({completed:true,score:1});
    expect(scoreDocumentHunt([clue],[])).toMatchObject({completed:false,score:0});
  });
  it("detects bad links, versions and misattributions",()=>{
    expect(scoreDocumentHunt([clue],[{...visit,visitedUrl:"https://other.gov/release"}]).completed).toBe(false);
    expect(scoreDocumentHunt([clue],[{...visit,sourceVersion:"v2"}]).completed).toBe(false);
    expect(scoreDocumentHunt([clue],[{...visit,sourceId:"other"}]).completed).toBe(false);
  });
  it("does not reward repeated visits or unrelated actions",()=>{
    expect(scoreDocumentHunt([clue],[visit,visit]).score).toBe(0);
  });
});
