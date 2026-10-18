import {evaluateFilingRoute,type ReviewedFilingRoute,type FilingGuidance} from "./verified-channel";

export interface SelfFilingGuide {
  status:"verified"|"unavailable";
  destination:string|null;
  sourceUrl:string|null;
  channel:"portal"|"email"|null;
  steps:readonly string[];
  notice:string;
}
const fallback:SelfFilingGuide={status:"unavailable",destination:null,sourceUrl:null,channel:null,
  steps:["Find the current agency component in the official FOIA.gov directory.",
    "Review that component's current submission instructions and fee rules.",
    "Copy or download your draft, then submit it yourself through the verified official channel.",
    "Keep the agency acknowledgement or email receipt for your own records."],
  notice:"An agency-specific filing destination has not been verified here. No request has been submitted."};

/** Guidance contains a direct destination only for a recently reviewed route. */
export function buildSelfFilingGuide(route:ReviewedFilingRoute|undefined,
  sourceHosts:readonly string[],channelHosts:readonly string[],now=new Date()):SelfFilingGuide {
  if(!route)return fallback;
  const guidance:FilingGuidance=evaluateFilingRoute(route,sourceHosts,channelHosts,now);
  if(guidance.status!=="verified" || !guidance.destination || !guidance.kind)
    return {...fallback,sourceUrl:guidance.sourceUrl};
  const action=guidance.kind==="portal"?
    "Open the verified agency portal and submit the request yourself.":
    "Send the request yourself from your own email account to the verified agency mailbox.";
  return {status:"verified",destination:guidance.destination,sourceUrl:guidance.sourceUrl,
    channel:guidance.kind,steps:["Review the agency's official filing instructions and fee rules.",
      "Copy or download your request draft and check it for accuracy.",action,
      "Keep the agency acknowledgement or sent email as your own record."],
    notice:"This guide does not submit a request or confirm agency receipt."};
}
