export type PageEvidence={page:number;nativeText:string;ocrText?:string;ocrStatus:"not_requested"|"succeeded"|"unavailable"|"failed"};
export type RecordClass="native"|"scanned"|"mixed"|"empty"|"unsupported"|"failed";
export interface ExtractionInput {
  mime:string;sourceSha256:string;requestId:string;pages:PageEvidence[];
  parserStatus:"succeeded"|"unsupported"|"failed";
}
export interface RecordClassification {
  kind:RecordClass;pageCount:number;sourceSha256:string;requestId:string;
  searchable:false;privateText:string|null;failureReason:string|null;
}
const MAX_PAGES=500,MAX_TEXT=2_000_000;
function useful(s:string){return s.trim().length>0;}

/** Classifies only privately extracted pages; public indexing requires separate review. */
export function classifyPrivateRecord(input:ExtractionInput):RecordClassification {
  if(!/^[a-f0-9]{64}$/.test(input.sourceSha256)||!input.requestId||input.requestId.length>128)
    throw new Error("Invalid source link");
  if(input.parserStatus!=="succeeded")return {kind:input.parserStatus,pageCount:0,
    sourceSha256:input.sourceSha256,requestId:input.requestId,searchable:false,
    privateText:null,failureReason:input.parserStatus};
  if(!Array.isArray(input.pages)||input.pages.length>MAX_PAGES)throw new Error("Page limit exceeded");
  let native=0,scanned=0,total=0;
  const parts:string[]=[];
  input.pages.forEach((page,i)=>{
    if(page.page!==i+1||typeof page.nativeText!=="string"||
       (page.ocrText!==undefined&&typeof page.ocrText!=="string"))throw new Error("Invalid page evidence");
    if(useful(page.nativeText))native++;
    else if(page.ocrStatus==="succeeded"&&page.ocrText&&useful(page.ocrText))scanned++;
    const selected=useful(page.nativeText)?page.nativeText:
      page.ocrStatus==="succeeded"?(page.ocrText??""):"";
    total+=selected.length;
    if(total>MAX_TEXT)throw new Error("Text limit exceeded");
    parts.push(selected);
  });
  const kind:RecordClass=native&&scanned?"mixed":native?"native":scanned?"scanned":"empty";
  return {kind,pageCount:input.pages.length,sourceSha256:input.sourceSha256,
    requestId:input.requestId,searchable:false,privateText:parts.join("\n"),failureReason:null};
}
