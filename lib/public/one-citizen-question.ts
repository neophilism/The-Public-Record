export interface CitizenQuestion {
  id:string;investigationId:string;text:string;submittedAt:string;
  moderation:"pending"|"approved"|"rejected";
  answer?:{text:string;sourceUrls:string[];reviewed:boolean};
}
export interface PublicQuestion {id:string;investigationId:string;text:string;
  status:"unanswered"|"answered";answerText:string|null;sourceUrls:string[];}
const targetPattern=/\b(?:home address|phone number|personal email|social security number)\b/i;
function safeUrl(s:string){try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false}}

/** A missing answer is not an allegation or agency violation. */
export function publicCitizenQuestion(q:CitizenQuestion):PublicQuestion|null {
  if(!q.id||!q.investigationId||q.text.trim().length<20||q.text.length>2000||
     !Number.isFinite(Date.parse(q.submittedAt)))throw new Error("Invalid question");
  if(q.moderation!=="approved"||targetPattern.test(q.text))return null;
  const answer=q.answer?.reviewed===true&&q.answer.text.trim()&&
    q.answer.sourceUrls.length>0&&q.answer.sourceUrls.every(safeUrl)?q.answer:null;
  return {id:q.id,investigationId:q.investigationId,text:q.text,
    status:answer?"answered":"unanswered",answerText:answer?answer.text:null,
    sourceUrls:answer?answer.sourceUrls:[]};
}
