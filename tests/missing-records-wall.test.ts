import {describe,it,expect} from "vitest";
import {buildMissingRecordsWall,type GapEntry} from "../lib/public/missing-records-wall";
const entries:GapEntry[]=[
  {id:"h",questionId:"q",title:"Possible record",state:"hypothetical",sourceUrls:[],evidenceRank:1},
  {id:"v",questionId:"q",title:"Documented gap",state:"missing_verified",sourceUrls:["https://agency.gov/index"],evidenceRank:4},
  {id:"r",questionId:"q",title:"Resolved gap",state:"resolved",sourceUrls:["https://agency.gov/release"],evidenceRank:3,resolvedBy:"release-1"}
];
describe("Missing Records Wall",()=>{
  it("separates verified, hypothetical and resolved counts",()=>{
    const wall=buildMissingRecordsWall(entries);
    expect(wall).toMatchObject({verifiedMissingCount:1,speculativeCount:1,resolvedCount:1});
    expect(wall.items.map(x=>x.id)).toEqual(["v","r","h"]);
    expect(buildMissingRecordsWall(entries,"hypothetical").items.map(x=>x.id)).toEqual(["h"]);
  });
  it("requires a source for verified missing entries and a resolution link",()=>{
    expect(()=>buildMissingRecordsWall([{...entries[1],sourceUrls:[]}])).toThrow();
    expect(()=>buildMissingRecordsWall([{...entries[2],resolvedBy:undefined}])).toThrow();
  });
});
