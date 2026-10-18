export interface PacketExcerpt {
  sourceId:string;sourceVersion:string;sourceSha256:string;sourceUrl:string;
  page:number;quote:string;context:string;
}
export interface PacketMedia {url:string;kind:"audio"|"video";transcript:string;captions?:string;}
export interface ReadingPacket {title:string;excerpts:PacketExcerpt[];media:PacketMedia[];printableText:string;}
function httpsUrl(s:string){try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false}}

/** Every excerpt binds to an exact source version; media require text alternatives. */
export function makeReadingPacket(title:string,excerpts:PacketExcerpt[],media:PacketMedia[]):ReadingPacket {
  if(!title.trim()||excerpts.length<1||excerpts.length>30||media.length>10)throw new Error("Invalid packet size");
  const seen=new Set<string>();
  for(const e of excerpts){
    const key=`${e.sourceId}:${e.sourceVersion}:${e.page}:${e.quote}`;
    if(!e.sourceId||!e.sourceVersion||!/^[a-f0-9]{64}$/.test(e.sourceSha256)||
       !httpsUrl(e.sourceUrl)||!Number.isSafeInteger(e.page)||e.page<1||
       !e.quote.trim()||e.quote.length>2000||!e.context.trim()||seen.has(key))throw new Error("Invalid excerpt provenance");
    seen.add(key);
  }
  for(const m of media){
    if(!httpsUrl(m.url)||!m.transcript.trim()||m.kind==="video"&&!m.captions?.trim())
      throw new Error("Media accessibility requirement missing");
  }
  const printableText=`${title}\n\n`+excerpts.map(e=>
    `Source ${e.sourceId}, version ${e.sourceVersion}, page ${e.page}\n${e.sourceUrl}\n${e.quote}\nContext: ${e.context}`
  ).join("\n\n");
  return {title,excerpts:[...excerpts],media:[...media],printableText};
}
