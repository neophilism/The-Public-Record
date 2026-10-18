import {describe,it,expect} from "vitest";
import {publicationState,type PublicationEvent} from "../lib/publication/publication-consent";
const sha="a".repeat(64);
const event=(id:string,kind:PublicationEvent["kind"],fields:PublicationEvent["fields"]):PublicationEvent=>({id,kind,fields,derivativeId:"d-1",derivativeSha256:sha,version:2,actorSubject:"actor",occurredAt:"2026-10-18T12:00:00Z"});
describe("versioned field publication consent",()=>{
  it("requires field-specific consent and editor approval",()=>{
    const state=publicationState([event("g","grant",["title","document"]),event("a","editor_approve",["title"])],"d-1",2,sha);
    expect(state.publishableFields).toEqual(["title"]);
  });
  it("withdrawal removes all fields and requests cache purge",()=>{
    const state=publicationState([event("g","grant",["document"]),event("a","editor_approve",["document"]),event("w","withdraw",[])],"d-1",2,sha);
    expect(state.publishableFields).toEqual([]);expect(state.needsCachePurge).toBe(true);
  });
  it("does not transfer consent to another derivative version",()=>{
    const state=publicationState([event("g","grant",["document"]),event("a","editor_approve",["document"])],"d-1",3,sha);
    expect(state.publishableFields).toEqual([]);
  });
  it("rejects duplicate events",()=>{
    expect(()=>publicationState([event("g","grant",["title"]),event("g","grant",["title"])],"d-1",2,sha)).toThrow();
  });
});
