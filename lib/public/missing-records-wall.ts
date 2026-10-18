export type GapState="missing_verified"|"hypothetical"|"resolved";
export interface GapEntry {id:string;questionId:string;title:string;state:GapState;sourceUrls:string[];evidenceRank:number;resolvedBy?:string;}
export interface Wall {verifiedMissingCount:number;speculativeCount:number;resolvedCount:number;items:GapEntry[];}
function officialSource(s:string){try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false}}

/** Speculative gaps are visible but excluded from the verified missing count. */
export function buildMissingRecordsWall(entries:GapEntry[],filter?:GapState):Wall {
  const seen=new Set<string>();
  for(const e of entries){
    if(!e.id||seen.has(e.id)||!e.questionId||!e.title.trim()||
       !["missing_verified","hypothetical","resolved"].includes(e.state)||
       !Number.isSafeInteger(e.evidenceRank)||e.evidenceRank<0||e.evidenceRank>5||
       !Array.isArray(e.sourceUrls)||e.sourceUrls.some(u=>!officialSource(u))||
       (e.state==="missing_verified"&&e.sourceUrls.length===0)||
       (e.state==="resolved"&&!e.resolvedBy))throw new Error("Invalid gap evidence");
    seen.add(e.id);
  }
  const items=entries.filter(e=>filter===undefined||e.state===filter)
    .sort((a,b)=>b.evidenceRank-a.evidenceRank||a.id.localeCompare(b.id));
  return {verifiedMissingCount:entries.filter(e=>e.state==="missing_verified").length,
    speculativeCount:entries.filter(e=>e.state==="hypothetical").length,
    resolvedCount:entries.filter(e=>e.state==="resolved").length,items};
}
