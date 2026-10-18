export interface HuntClue {id:string;sourceId:string;sourceVersion:string;sourceSha256:string;sourceUrl:string;prompt:string;}
export interface SourceVisit {clueId:string;sourceId:string;sourceVersion:string;sourceSha256:string;visitedUrl:string;answerVerified:boolean;}
export interface HuntResult {completed:boolean;verifiedClues:number;totalClues:number;score:number;errors:string[];}
function sameHttps(a:string,b:string){try{const x=new URL(a),y=new URL(b);return x.protocol==="https:"&&!x.username&&!x.password&&x.toString()===y.toString();}catch{return false}}

/** Score evidence navigation only. Filing, invitations and volume carry no points. */
export function scoreDocumentHunt(clues:HuntClue[],visits:SourceVisit[]):HuntResult {
  if(clues.length<1||clues.length>20)throw new Error("Invalid hunt");
  const ids=new Set<string>(),errors:string[]=[];let verified=0;
  for(const c of clues){
    if(!c.id||ids.has(c.id)||!c.sourceId||!c.sourceVersion||
       !/^[a-f0-9]{64}$/.test(c.sourceSha256)||!sameHttps(c.sourceUrl,c.sourceUrl)||!c.prompt.trim())
      throw new Error("Invalid clue provenance");
    ids.add(c.id);
    const matches=visits.filter(v=>v.clueId===c.id);
    if(matches.length!==1){errors.push(`${c.id}: missing or duplicate visit`);continue;}
    const v=matches[0];
    if(v.sourceId!==c.sourceId||v.sourceVersion!==c.sourceVersion||v.sourceSha256!==c.sourceSha256||
       !sameHttps(v.visitedUrl,c.sourceUrl)||!v.answerVerified){errors.push(`${c.id}: source mismatch`);continue;}
    verified++;
  }
  if(visits.some(v=>!ids.has(v.clueId)))errors.push("Unknown clue visit");
  return {completed:verified===clues.length&&errors.length===0,
    verifiedClues:verified,totalClues:clues.length,score:verified,errors};
}
