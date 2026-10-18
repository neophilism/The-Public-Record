import {describe,it,expect} from "vitest";
import {makeReadingPacket,type PacketExcerpt} from "../lib/public/reading-packet";
const excerpt:PacketExcerpt={sourceId:"release-1",sourceVersion:"v2",sourceSha256:"a".repeat(64),sourceUrl:"https://agency.gov/release",page:2,quote:"Reviewed excerpt",context:"The excerpt addresses the stated question."};
describe("Read the Record packet",()=>{
  it("prints exact source version and citation",()=>{
    const packet=makeReadingPacket("Reading packet",[excerpt],[]);
    expect(packet.printableText).toContain("version v2, page 2");
    expect(packet.printableText).toContain(excerpt.sourceUrl);
  });
  it("rejects source duplicates and missing provenance",()=>{
    expect(()=>makeReadingPacket("Packet",[excerpt,excerpt],[])).toThrow();
    expect(()=>makeReadingPacket("Packet",[{...excerpt,sourceSha256:""}],[])).toThrow();
  });
  it("requires transcripts and video captions",()=>{
    expect(()=>makeReadingPacket("Packet",[excerpt],[{kind:"video",url:"https://agency.gov/video",transcript:"Transcript"}])).toThrow();
    expect(makeReadingPacket("Packet",[excerpt],[{kind:"video",url:"https://agency.gov/video",transcript:"Transcript",captions:"Captions"}]).media).toHaveLength(1);
  });
});
