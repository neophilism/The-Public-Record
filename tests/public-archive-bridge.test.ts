import {describe,it,expect} from "vitest";
import {publicCitation,dedupePublicCitations,type PublicSource} from "../lib/publication/public-archive-bridge";
const source:PublicSource={documentId:"release-1",kind:"release",sha256:"a".repeat(64),sourceUrl:"https://agency.gov/release",sourceSnapshotSha256:"b".repeat(64),reviewedAt:"2026-10-18T12:00:00Z",title:"Reviewed release"};
describe("public archive bridge",()=>{
  it("retains local provenance through archive outage and mismatched hash",()=>{
    const offline=publicCitation(source,undefined);
    expect(offline.archiveUrl).toBeNull();expect(offline.sourceSnapshotSha256).toBe(source.sourceSnapshotSha256);
    expect(publicCitation(source,{externalId:"x",sha256:"c".repeat(64),url:"https://archive.gov/x"}).archiveUrl).toBeNull();
  });
  it("associates only the same public bytes and deduplicates releases",()=>{
    const a=publicCitation(source,{externalId:"x",sha256:source.sha256,url:"https://archive.gov/x"});
    const b=publicCitation({...source,documentId:"release-2"},undefined);
    expect(a.archiveUrl).toBe("https://archive.gov/x");
    expect(dedupePublicCitations([b,a])).toHaveLength(1);
  });
  it("does not conflate a release with correspondence or mutable source snapshot",()=>{
    const release=publicCitation(source,undefined);
    const letter=publicCitation({...source,documentId:"letter-1",kind:"correspondence"},undefined);
    expect(dedupePublicCitations([release,letter])).toHaveLength(2);
    const revised=publicCitation({...source,sourceSnapshotSha256:"d".repeat(64)},undefined);
    expect(revised.sourceSnapshotSha256).not.toBe(release.sourceSnapshotSha256);
  });
});
