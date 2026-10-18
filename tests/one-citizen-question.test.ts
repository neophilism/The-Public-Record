import {describe,it,expect} from "vitest";
import {publicCitizenQuestion,type CitizenQuestion} from "../lib/public/one-citizen-question";
const question:CitizenQuestion={id:"q1",investigationId:"i1",text:"What records explain this public decision?",submittedAt:"2026-10-18T12:00:00Z",moderation:"approved"};
describe("One Citizen One Question",()=>{
  it("labels a question with no reviewed answer as unanswered",()=>{
    const result=publicCitizenQuestion(question);
    expect(result?.status).toBe("unanswered");expect(result?.answerText).toBeNull();
    expect(JSON.stringify(result)).not.toContain("violation");
  });
  it("requires reviewed source-backed answers",()=>{
    expect(publicCitizenQuestion({...question,answer:{text:"Unreviewed claim",sourceUrls:["https://agency.gov/record"],reviewed:false}})?.status).toBe("unanswered");
    expect(publicCitizenQuestion({...question,answer:{text:"Source-backed answer",sourceUrls:["https://agency.gov/record"],reviewed:true}})?.status).toBe("answered");
  });
  it("does not publish pending or obvious personal targeting",()=>{
    expect(publicCitizenQuestion({...question,moderation:"pending"})).toBeNull();
    expect(publicCitizenQuestion({...question,text:"What is this official's home address?"})).toBeNull();
  });
});
