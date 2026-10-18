export interface ReceiptEvidence {
  receiptId:string;publicSlug:string;requestDate:string|null;agencyReceiptDate:string|null;
  releasedPages:number|null;pageCountVerified:boolean;sourceSha256:string;
  attribution:"anonymous"|"pseudonym"|"named";displayName?:string;
  namePublicationConsent:boolean;correctedAt?:string;
}
export interface ReceiptCard {id:string;requestDate:string|null;agencyReceiptDate:string|null;
  releasedPages:number|null;verification:"verified"|"unverified";
  attribution:string;qrUrl:string;sourceSha256:string;}

/** Canonical URL resolves current corrected evidence; no private identity is serialized. */
export function publicReceipt(e:ReceiptEvidence,origin:string):ReceiptCard {
  const base=new URL(origin);
  if(base.protocol!=="https:"||base.username||base.password||base.pathname!=="/"||
     !/^[a-z0-9-]{3,100}$/.test(e.publicSlug)||!e.receiptId||
     !/^[a-f0-9]{64}$/.test(e.sourceSha256)||
     (e.releasedPages!==null&&(!Number.isSafeInteger(e.releasedPages)||e.releasedPages<0)))
    throw new Error("Invalid public receipt");
  const attribution=e.attribution==="named"&&e.namePublicationConsent&&e.displayName?.trim()?e.displayName.trim():
    e.attribution==="pseudonym"&&e.namePublicationConsent&&e.displayName?.trim()?e.displayName.trim():"Anonymous participant";
  return {id:e.receiptId,requestDate:e.requestDate,agencyReceiptDate:e.agencyReceiptDate,
    releasedPages:e.pageCountVerified?e.releasedPages:null,
    verification:e.pageCountVerified&&e.agencyReceiptDate?"verified":"unverified",
    attribution,qrUrl:new URL(`/public-record/receipts/${e.publicSlug}`,base).toString(),
    sourceSha256:e.sourceSha256};
}
