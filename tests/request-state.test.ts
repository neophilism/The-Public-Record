import {describe,it,expect} from "vitest";
import {canTransition} from "../lib/domain/request-state";
describe("FOIA request lifecycle",()=>{it("does not silently file unclaimed requests",()=>expect(canTransition("unclaimed","submitted_unverified")).toBe(false));it("requires agency acknowledgement",()=>expect(canTransition("submitted_unverified","released")).toBe(false));it("permits adoption",()=>expect(canTransition("unclaimed","adopted")).toBe(true))});
