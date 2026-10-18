export interface Contribution {id:string;kind:"source_review"|"correction"|"request_filing";
  verified:boolean;sourceUrl?:string;}
export interface Recognition {eligible:boolean;reviewedEvidenceCount:number;message:string;}

/** Filing volume is deliberately absent from recognition. */
export function participationRecognition(items:Contribution[]):Recognition {
  const seen=new Set<string>();let count=0;
  for(const item of items){
    if(!item.id||seen.has(item.id))throw new Error("Duplicate contribution");
    seen.add(item.id);
    if(item.verified&&item.kind!=="request_filing"&&item.sourceUrl){
      const u=new URL(item.sourceUrl);
      if(u.protocol==="https:"&&!u.username&&!u.password)count++;
    }
  }
  return {eligible:count>0,reviewedEvidenceCount:count,
    message:"Participation is voluntary. Prepare and file any request yourself; keep private details out of public contributions."};
}
