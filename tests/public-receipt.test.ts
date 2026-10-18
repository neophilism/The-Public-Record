import {describe,it,expect} from "vitest";
import {publicReceipt,type ReceiptEvidence} from "../lib/public/public-receipt";
const evidence:ReceiptEvidence={receiptId:"receipt-1",publicSlug:"receipt-1",requestDate:"2026-10-01",agencyReceiptDate:null,releasedPages:null,pageCountVerified:false,sourceSha256:"a".repeat(64),attribution:"anonymous",namePublicationConsent:false,displayName:"Private Name"};
describe("public receipt card",()=>{
  it("keeps unknown pages unknown and excludes a private name",()=>{
    const card=publicReceipt(evidence,"https://example.gov/");
    expect(card.releasedPages).toBeNull();expect(card.verification).toBe("unverified");
    expect(JSON.stringify(card)).not.toContain("Private Name");
  });
  it("uses the current canonical route for QR and requires explicit name consent",()=>{
    const card=publicReceipt({...evidence,correctedAt:"2026-10-18",agencyReceiptDate:"2026-10-02",releasedPages:5,pageCountVerified:true,attribution:"named",namePublicationConsent:true},"https://example.gov/");
    expect(card.qrUrl).toBe("https://example.gov/public-record/receipts/receipt-1");
    expect(card.releasedPages).toBe(5);expect(card.attribution).toBe("Private Name");
  });
  it("rejects negative counts and unsafe origins",()=>{
    expect(()=>publicReceipt({...evidence,releasedPages:-1},"https://example.gov/")).toThrow();
    expect(()=>publicReceipt(evidence,"http://example.gov/")).toThrow();
  });
});
