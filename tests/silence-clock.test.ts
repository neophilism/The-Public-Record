import {describe,it,expect} from "vitest";
import {silenceClock} from "../lib/public/silence-clock";
const base={requestDate:"2026-10-01T00:00:00Z",asOf:"2026-10-18T00:00:00Z",lastVerifiedAt:"2026-10-17T00:00:00Z"};
describe("Silence Clock exhibit",()=>{
  it("separates elapsed time from receipt and working-day estimates",()=>{
    const r=silenceClock({...base,agencyReceiptDate:"2026-10-03T00:00:00Z",estimatedWorkingDays:9,extensionNote:"Agency notice under review"});
    expect(r.totalElapsedDays).toBe(17);expect(r.agencyReceiptElapsedDays).toBe(15);
    expect(r.estimatedStatutoryWorkingDays).toBe(9);expect(r.legalConclusion).toBeNull();
  });
  it("shows uncertainty without verified receipt and marks stale feeds",()=>{
    const r=silenceClock({...base,lastVerifiedAt:"2026-10-01T00:00:00Z",estimatedWorkingDays:10});
    expect(r.agencyReceiptElapsedDays).toBeNull();expect(r.estimatedStatutoryWorkingDays).toBeNull();expect(r.stale).toBe(true);
  });
  it("stops at a recorded terminal response",()=>{
    const r=silenceClock({...base,agencyReceiptDate:"2026-10-03T00:00:00Z",terminalResponseAt:"2026-10-10T00:00:00Z"});
    expect(r.totalElapsedDays).toBe(9);expect(r.agencyReceiptElapsedDays).toBe(7);expect(r.stopped).toBe(true);
  });
});
