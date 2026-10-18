# TPR-24 — Cautious FOIA timing estimates

The federal FOIA calls for an agency determination within 20 working days after receipt by the appropriate component, excluding Saturdays, Sundays and legal public holidays. Limited tolling is permitted for one reasonable information request and for fee clarification. An unusual-circumstances extension ordinarily requires written notice and is limited to ten additional working days absent the statute's alternative-timeframe process. An adverse determination must offer at least 90 days to file an administrative appeal; the agency's actual stated period may be longer.

Primary sources: [5 U.S.C. § 552(a)(6)](https://uscode.house.gov/us/usc/119-120/t5/s552/) and the [OPM federal holiday schedule](https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/).

`estimateRequestClock` counts after a supplied agency-receipt date using a reviewed official holiday calendar. It excludes documented toll intervals and accepts up to ten additional working days only with a reviewed written notice. Unknown receipt, open tolling, insufficient calendar coverage, multiple information tolls and longer or unreviewed extensions suppress a date for manual review. It never labels delay unlawful. The estimate does not model disputes about which agency component received the request, clock-start rules for routing, an agreed alternative timeframe, exceptional circumstances, agency closures or case-specific regulations.

`minimumAppealWindowEnd` adds 90 calendar days to an adverse-determination date as a statutory floor, not the agency's final appeal deadline. Review the actual determination letter and agency rules before showing a deadline to a requester. No live case clock is enabled by this module.
