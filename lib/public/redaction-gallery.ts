export interface ReleasePage {
  releaseId:string;pageNumber:number;imageUrl:string;requestId:string;
  sourceUrl:string;publicationStatus:"published"|"private";
  releaseVerified:boolean;hasVisibleRedaction:boolean;
}
export interface Annotation {releaseId:string;pageNumber:number;label:string;exemption?:string;reviewed:boolean;}
export interface GalleryPage {releaseId:string;pageNumber:number;imageUrl:string;requestId:string;
  sourceUrl:string;annotations:{label:string;exemption?:string}[];}
function safeUrl(s:string){try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false}}

/** Returns only verified, published release pages; annotations are an overlay. */
export function redactionGallery(pages:ReleasePage[],annotations:Annotation[]):GalleryPage[] {
  const seen=new Set<string>();const out:GalleryPage[]=[];
  for(const p of pages){
    if(!p.releaseVerified||p.publicationStatus!=="published"||!p.hasVisibleRedaction)continue;
    if(!p.releaseId||!p.requestId||!Number.isSafeInteger(p.pageNumber)||p.pageNumber<1||
       !safeUrl(p.imageUrl)||!safeUrl(p.sourceUrl))throw new Error("Invalid release page");
    const key=`${p.releaseId}:${p.pageNumber}`;
    if(seen.has(key))throw new Error("Duplicate release page");seen.add(key);
    out.push({releaseId:p.releaseId,pageNumber:p.pageNumber,imageUrl:p.imageUrl,
      requestId:p.requestId,sourceUrl:p.sourceUrl,
      annotations:annotations.filter(a=>a.releaseId===p.releaseId&&a.pageNumber===p.pageNumber&&a.reviewed&&a.label.trim())
        .map(a=>({label:a.label,exemption:a.exemption}))});
  }
  return out.sort((a,b)=>a.releaseId.localeCompare(b.releaseId)||a.pageNumber-b.pageNumber);
}
