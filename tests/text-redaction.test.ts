import {describe,it,expect} from "vitest";
import {createHash} from "node:crypto";
import {redactReviewedText} from "../lib/publication/text-redaction";
const source="Case name: Jane Secret. Address: 1 Private Road. Public fact: released.";
const digest=createHash("sha256").update(source).digest("hex");
const gate={sourceSha256:digest,reviewerSubject:"reviewer-1",approvedAt:"2026-10-18T12:00:00Z",consentId:"consent-1"};
describe("private text derivative",()=>{
  it("removes source spans from rendered and copyable text",()=>{
    const a=source.indexOf("Jane Secret"),b=source.indexOf("1 Private Road");
    const result=redactReviewedText(source,[{start:a,end:a+11,reason:"personal_data"},{start:b,end:b+14,reason:"personal_data"}],gate);
    expect(result.redactedText).not.toContain("Jane Secret");
    expect(result.redactedText).not.toContain("1 Private Road");
    expect(JSON.stringify(result)).not.toContain("Private Road");
    expect(result.status).toBe("reviewed_private_derivative");
  });
  it("requires matching source, consent and independent review",()=>{
    const range=[{start:0,end:4,reason:"personal_data" as const}];
    expect(()=>redactReviewedText(source,range,{...gate,sourceSha256:"a".repeat(64)})).toThrow();
    expect(()=>redactReviewedText(source,range,{...gate,consentId:""})).toThrow();
    expect(()=>redactReviewedText(source,range,{...gate,reviewerSubject:""})).toThrow();
  });
  it("rejects overlapping or zero-width ranges",()=>{
    expect(()=>redactReviewedText(source,[{start:0,end:4,reason:"personal_data"},{start:3,end:5,reason:"personal_data"}],gate)).toThrow();
    expect(()=>redactReviewedText(source,[{start:0,end:0,reason:"personal_data"}],gate)).toThrow();
  });
});
