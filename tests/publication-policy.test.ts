import {describe,it,expect} from "vitest";
import {canPublish,canReplicate,toPublicDerivativeManifest,type PublicationDecision} from "../lib/security/publication-policy";
const granted=():PublicationDecision=>({
  classification:"publication_derivative",grant:"granted",reviewer:"approved",
  scan:"passed",consent_item_id:"grant-01",derivative_id:"public-01",
  derivative_sha256:"0".repeat(64),approved_for_distribution:false
});
describe("private-to-public boundary",()=>{
  it("denies originals and quarantine even after a purported grant",()=>{
    expect(canPublish({...granted(),classification:"private_original"})).toBe(false);
    expect(canPublish({...granted(),classification:"quarantine"})).toBe(false);
  });
  it("requires grants, reviewer approval, scan and a specific derivative",()=>{
    for (const value of [
      {...granted(),grant:"absent" as const},{...granted(),grant:"revoked" as const},
      {...granted(),reviewer:"pending" as const},{...granted(),reviewer:"rejected" as const},
      {...granted(),scan:"unscanned" as const},{...granted(),scan:"blocked" as const},
      {...granted(),derivative_id:null},{...granted(),consent_item_id:null},
      {...granted(),derivative_sha256:"not-a-digest"}
    ]) expect(canPublish(value)).toBe(false);
  });
  it("replication requires additional opt-in",()=>{
    expect(canPublish(granted())).toBe(true);
    expect(canReplicate(granted())).toBe(false);
    expect(canReplicate({...granted(),approved_for_distribution:true})).toBe(true);
  });
  it("returns only public fields without leaking private data",()=>{
    const source={...granted(),private_address:"hidden",private_correspondence:"hidden"};
    expect(toPublicDerivativeManifest(source)).toEqual({
      version:"public-derivative/v1",derivative_id:"public-01",sha256:"0".repeat(64)
    });
    expect(toPublicDerivativeManifest({...source,grant:"revoked"})).toBeNull();
  });
});
