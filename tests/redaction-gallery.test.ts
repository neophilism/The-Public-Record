import {describe,it,expect} from "vitest";
import {redactionGallery,type ReleasePage} from "../lib/public/redaction-gallery";
const page:ReleasePage={releaseId:"release-1",pageNumber:1,imageUrl:"https://agency.gov/page-1.png",requestId:"request-1",sourceUrl:"https://agency.gov/release",publicationStatus:"published",releaseVerified:true,hasVisibleRedaction:true};
describe("Redaction Gallery projection",()=>{
  it("shows only genuine published redacted release pages",()=>{
    const result=redactionGallery([page,{...page,releaseId:"private",publicationStatus:"private"},{...page,releaseId:"plain",hasVisibleRedaction:false}],[]);
    expect(result).toHaveLength(1);expect(result[0].releaseId).toBe("release-1");
  });
  it("keeps reviewed annotations separate from the source image",()=>{
    const result=redactionGallery([page],[{releaseId:"release-1",pageNumber:1,label:"Agency states exemption (b)(6)",exemption:"(b)(6)",reviewed:true},{releaseId:"release-1",pageNumber:1,label:"Unreviewed",reviewed:false}]);
    expect(result[0].annotations).toHaveLength(1);
    expect(result[0].imageUrl).toBe(page.imageUrl);
    expect(JSON.stringify(page)).not.toContain("(b)(6)");
  });
  it("rejects duplicate release pages",()=>{
    expect(()=>redactionGallery([page,page],[])).toThrow();
  });
});
