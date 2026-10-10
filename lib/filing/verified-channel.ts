/** Reviewed self-filing routes; never an auto-submission interface. */
export type FilingChannel =
 | {kind:"portal";portalUrl:string}
 | {kind:"email";emailAddress:string};
export interface ReviewedFilingRoute {
  agencyComponentId:string;
  sourceUrl:string;
  verifiedBy:string;
  verifiedAt:string;
  approval:"approved"|"pending"|"rejected";
  channel:FilingChannel;
}
export interface FilingGuidance {
  status:"verified"|"stale"|"rejected";
  destination:string|null;
  kind:"portal"|"email"|null;
  sourceUrl:string|null;
  warning:string|null;
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const mail=/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+$/;
const redirectKeys=new Set(["url","next","continue","redirect","redirect_uri","return_url","returnurl","destination"]);
function trusted(urlText:string,hosts:readonly string[]):URL|null {
  try{
    const url=new URL(urlText);
    if(url.protocol!=="https:" || url.username || url.password || url.port || url.hash ||
      !hosts.includes(url.hostname.toLowerCase()) || url.pathname.startsWith("//"))return null;
    for(const [key,value] of url.searchParams){
      if(redirectKeys.has(key.toLowerCase()) && /^(https?:|\/\/)/i.test(value.trim()))return null;
    }
    return url;
  }catch{return null;}
}
export function evaluateFilingRoute(
  route:ReviewedFilingRoute,
  trustedSourceHosts:readonly string[],
  trustedChannelHosts:readonly string[],
  now=new Date()
):FilingGuidance {
  const rejected:FilingGuidance={status:"rejected",kind:null,destination:null,sourceUrl:null,warning:"Filing route not verified"};
  if(!route || !uuid.test(route.agencyComponentId) || route.approval!=="approved" ||
     !route.verifiedBy?.trim() || route.verifiedBy.length>200)return rejected;
  const source=trusted(route.sourceUrl,trustedSourceHosts);
  if(!source)return rejected;
  const verifiedTime=Date.parse(route.verifiedAt);
  if(!Number.isFinite(verifiedTime) || verifiedTime>now.getTime() ||
     now.getTime()-verifiedTime>90*86400000)
    return {status:"stale",kind:null,destination:null,sourceUrl:source.href,
      warning:"Official filing instructions need renewed verification"};
  if(route.channel.kind==="portal"){
    const portal=trusted(route.channel.portalUrl,trustedChannelHosts);
    if(!portal)return rejected;
    return {status:"verified",kind:"portal",destination:portal.href,sourceUrl:source.href,warning:null};
  }
  if(route.channel.kind==="email"){
    if(!mail.test(route.channel.emailAddress) || route.channel.emailAddress.length>320)return rejected;
    const domain=route.channel.emailAddress.split("@")[1].toLowerCase();
    if(!trustedChannelHosts.includes(domain))return rejected;
    return {status:"verified",kind:"email",destination:"mailto:"+route.channel.emailAddress,
      sourceUrl:source.href,warning:"Send this request yourself from your own email account"};
  }
  return rejected;
}
export function isMaterialChannelChange(before:ReviewedFilingRoute,after:ReviewedFilingRoute):boolean {
  if(before.agencyComponentId!==after.agencyComponentId ||
     before.sourceUrl!==after.sourceUrl || before.channel.kind!==after.channel.kind)return true;
  if(before.channel.kind==="portal" && after.channel.kind==="portal")
    return before.channel.portalUrl!==after.channel.portalUrl;
  if(before.channel.kind==="email" && after.channel.kind==="email")
    return before.channel.emailAddress!==after.channel.emailAddress;
  return true;
}
export function verifyRedirectTarget(
  currentUrl:string,
  proposedLocation:string,
  verifiedHosts:readonly string[]
):string|null {
  const current=trusted(currentUrl,verifiedHosts);
  if(!current)return null;
  try{
    const target=new URL(proposedLocation,current.href);
    return trusted(target.href,verifiedHosts)?.href??null;
  }catch{return null;}
}
