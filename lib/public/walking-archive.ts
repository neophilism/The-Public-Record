export interface ArchiveSignInput {slug:string;title:string;summary:string;sourceSha256:string;
  reviewStatus:"approved"|"pending";correctedAt?:string;privateName?:string;}
export interface ArchiveSign {title:string;summary:string;qrPayload:string;printText:string;
  correctionNotice:string|null;sourceSha256:string;}

/** Print artifacts point to a canonical page that can display future corrections. */
export function makeArchiveSign(input:ArchiveSignInput,origin:string):ArchiveSign {
  const base=new URL(origin);
  if(base.protocol!=="https:"||base.username||base.password||base.pathname!=="/"||
     input.reviewStatus!=="approved"||!/^[a-z0-9-]{3,100}$/.test(input.slug)||
     !/^[a-f0-9]{64}$/.test(input.sourceSha256)||
     !input.title.trim()||!input.summary.trim()||input.summary.length>500)
    throw new Error("Unapproved or invalid public sign");
  if(input.privateName&&(input.title.includes(input.privateName)||input.summary.includes(input.privateName)))
    throw new Error("Private name in public sign");
  const qrPayload=new URL(`/public-record/archive/${input.slug}`,base).toString();
  const correctionNotice=input.correctedAt?"This source has a correction. Scan or visit the current page before sharing.":null;
  return {title:input.title,summary:input.summary,qrPayload,correctionNotice,
    sourceSha256:input.sourceSha256,
    printText:`${input.title}\n\n${input.summary}\n\nCurrent source and corrections: ${qrPayload}`+
      (correctionNotice?`\n${correctionNotice}`:"")};
}
