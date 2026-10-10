import {describe,it,expect} from "vitest";
import {buildRequestTimeline,type RecordedTransition,type RecordedCorrection} from "../lib/requests/event-projection";
const t=(eventId:string,sequence:number,from:RecordedTransition["from"],to:RecordedTransition["to"],
  source:"requester_report"|"verified_agency_document"="requester_report"):RecordedTransition=>({
  kind:"transition",eventId,sequence,from,to,receivedAt:"2026-10-10T15:00:00Z",
  evidence:{source,evidence_id:source==="verified_agency_document"?"agency-receipt-1":null,
    reviewer_verified:source==="verified_agency_document"},privateNote:"protected example",
  uploadedProofId:"private-upload-id"
});
describe("replay-safe, attributable FOIA status projections",()=>{
 it("rebuilds out-of-order submissions in sequence without conflating self-reports with agency receipt",()=>{
   const list=[t("evt-002",2,"adopted","draft"),t("evt-001",1,"unclaimed","adopted"),
     t("evt-003",3,"draft","submitted_unverified"),
     t("evt-004",4,"submitted_unverified","acknowledged","verified_agency_document")];
   const out=buildRequestTimeline(list);
   expect(out.state).toBe("acknowledged");
   expect(out.rejected).toEqual([]);
   expect(out.events.map(e=>e.eventId)).toEqual(["evt-001","evt-002","evt-003","evt-004"]);
   expect(JSON.stringify(out)).not.toContain("protected example");
   expect(JSON.stringify(out)).not.toContain("private-upload-id");
   expect(JSON.stringify(out)).not.toContain("agency-receipt-1");
 });
 it("does not treat a requester-reported filing as acknowledged",()=>{
   const out=buildRequestTimeline([t("evt-001",1,"unclaimed","adopted"),
     t("evt-002",2,"adopted","draft"),t("evt-003",3,"draft","submitted_unverified"),
     t("evt-004",4,"submitted_unverified","acknowledged")]);
   expect(out.state).toBe("submitted_unverified");
   expect(out.rejected).toContainEqual({eventId:"evt-004",reason:"invalid_transition"});
 });
 it("reports duplicate and conflicting events without changing verified state",()=>{
   const out=buildRequestTimeline([t("evt-001",1,"unclaimed","adopted"),
     t("evt-001",2,"adopted","draft"),
     t("evt-003",3,"unclaimed","draft")]);
   expect(out.state).toBe("adopted");
   expect(out.rejected.map(e=>e.reason)).toEqual(expect.arrayContaining(["duplicate_id","conflict"]));
 });
 it("keeps corrected history and rebuilds without erasing source events",()=>{
   const correction:RecordedCorrection={kind:"correction",eventId:"fix-001",sequence:5,
     receivedAt:"2026-10-10T16:00:00Z",correctedEventId:"evt-003",
     reason:"Requester discovered the draft had not actually been submitted."};
   const out=buildRequestTimeline([
     t("evt-001",1,"unclaimed","adopted"),
     t("evt-002",2,"adopted","draft"),
     t("evt-003",3,"draft","submitted_unverified"),correction]);
   expect(out.state).toBe("draft");
   expect(out.events.find(e=>e.eventId==="evt-003")?.superseded).toBe(true);
   expect(out.events.find(e=>e.eventId==="fix-001")?.corrects).toBe("evt-003");
 });
 it("does not let an invalid correction quietly replace a nonexistent event",()=>{
   const correction:RecordedCorrection={kind:"correction",eventId:"fix-001",sequence:2,
     receivedAt:"2026-10-10T16:00:00Z",correctedEventId:"evt-missing",
     reason:"Mistaken submission status in source record"};
   const out=buildRequestTimeline([t("evt-001",1,"unclaimed","adopted"),correction]);
   expect(out.state).toBe("adopted");
   expect(out.rejected).toContainEqual({eventId:"fix-001",reason:"unknown_reference"});
 });
});
