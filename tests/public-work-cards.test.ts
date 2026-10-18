import {describe,expect,it} from "vitest";
import {projectPublicWorkCards} from "../lib/adoption/public-work-cards";

const question={id:"q-1",slug:"sample-records",headline:"Which records exist?",
  status:"question_posed" as const,citation_ids:[],internal_notes:"private note",
  requester_identifier:"secret person",submitter_contact:"private@example.test"};
describe("anonymous work card projection",()=>{
  it("shows public availability without a participant identity or private draft",()=>{
    const cards=projectPublicWorkCards([{question,published:true,activeAdoptions:1}]);
    expect(cards).toEqual([{question:{id:"q-1",slug:"sample-records",
      headline:"Which records exist?",claim_status:"question_posed",citation_ids:[]},
      availability:"adopted"}]);
    const raw=JSON.stringify(cards);
    expect(raw).not.toContain("secret person");
    expect(raw).not.toContain("private note");
    expect(raw).not.toContain("private@example.test");
  });
  it("omits unpublished questions and distinguishes unclaimed work",()=>{
    expect(projectPublicWorkCards([{question,published:false,activeAdoptions:0}])).toEqual([]);
    expect(projectPublicWorkCards([{question,published:true,activeAdoptions:0}])[0].availability)
      .toBe("unclaimed");
    expect(()=>projectPublicWorkCards([{question,published:true,activeAdoptions:-1}])).toThrow();
  });
});
