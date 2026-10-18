import {describe,expect,it} from "vitest";
import {estimateRequestClock,minimumAppealWindowEnd,type HolidayCalendar} from "../lib/filing/foia-clock";

const holidays:HolidayCalendar={dates:["2026-01-01","2026-01-19","2026-02-16"],
  verifiedThrough:"2026-12-31",sourceUrl:"https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/"};
const base={receivedOn:"2026-01-02",holidays,tolls:[]};
describe("FOIA calendar estimates",()=>{
  it("counts twenty weekdays after receipt and excludes official holidays",()=>{
    expect(estimateRequestClock(base)).toMatchObject({status:"estimated",estimatedOn:"2026-02-02"});
  });
  it("returns no date when agency receipt or the holiday calendar is uncertain",()=>{
    expect(estimateRequestClock({...base,receivedOn:null}).status).toBe("unknown_receipt");
    expect(estimateRequestClock({...base,holidays:{...holidays,verifiedThrough:"2026-01-31"}}).status)
      .toBe("review_needed");
  });
  it("accounts for fee clarification pauses but stops on an unresolved pause",()=>{
    expect(estimateRequestClock({...base,tolls:[{kind:"fee",startedOn:"2026-01-08",
      endedOn:"2026-01-09"}]})).toMatchObject({status:"estimated",estimatedOn:"2026-02-04"});
    expect(estimateRequestClock({...base,tolls:[{kind:"fee",startedOn:"2026-01-08",
      endedOn:null}]}).status).toBe("review_needed");
  });
  it("requires a reviewed written notice for an unusual-circumstances extension",()=>{
    expect(estimateRequestClock({...base,unusual:{writtenNoticeReviewed:false,
      extraWorkingDays:10}}).status).toBe("review_needed");
    expect(estimateRequestClock({...base,unusual:{writtenNoticeReviewed:true,
      extraWorkingDays:10}})).toMatchObject({status:"estimated",estimatedOn:"2026-02-17"});
    expect(estimateRequestClock({...base,unusual:{writtenNoticeReviewed:true,
      extraWorkingDays:11}}).status).toBe("review_needed");
  });
  it("shows only the statutory minimum appeal window, not a final agency deadline",()=>{
    expect(minimumAppealWindowEnd("2026-01-02")).toBe("2026-04-02");
  });
});
