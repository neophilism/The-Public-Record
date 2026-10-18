import {describe,it,expect} from "vitest";
import {publicSearch,type SearchItem} from "../lib/public/public-search";
const item=(id:string,visibility:SearchItem["visibility"]):SearchItem=>({id,kind:"file",title:`Record ${id}`,visibility,publishedAt:"2026-10-18T12:00:00Z",sourceReviewedAt:"2026-10-17T12:00:00Z"});
describe("public search and metrics",()=>{
  it("excludes private rows from results and counts",()=>{
    const page=publicSearch([item("a","published"),item("secret","private")],"Record");
    expect(page.items.map(x=>x.id)).toEqual(["a"]);
    expect(page.publishedCounts.files).toBe(1);expect(page.coverageClaim).toBeNull();
  });
  it("paginates in stable time/id order",()=>{
    const all=[item("c","published"),item("a","published"),item("b","published")];
    const first=publicSearch(all,"",2);
    expect(first.items.map(x=>x.id)).toEqual(["a","b"]);
    expect(publicSearch(all,"",2,first.nextCursor!).items.map(x=>x.id)).toEqual(["c"]);
  });
});
