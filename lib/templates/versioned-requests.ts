import {randomUUID} from "node:crypto";
export interface RequestTemplate {
  templateId:string;
  version:number;
  title:string;
  agencyComponentId:string;
  recordsDescription:string;
  rangeStart:string|null;
  rangeEnd:string|null;
  state:"draft"|"in_review"|"published"|"retired";
  editorId:string;
  reviewerId:string|null;
  sourceIds:readonly string[];
}
export interface PinnedRequestDraft {
  adoptionId:string;
  adoptedBy:string;
  templateId:string;
  templateVersion:number;
  title:string;
  agencyComponentId:string;
  recordsDescription:string;
  rangeStart:string|null;
  rangeEnd:string|null;
}
const component=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function validDate(value:string|null):boolean {
  if(value===null)return true;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+"T00:00:00Z");
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0,10)===value;
}
export function validateRequestTemplate(t:RequestTemplate):void {
  if(!t || typeof t.templateId!=="string" || !/^[a-zA-Z0-9_-]{3,128}$/.test(t.templateId) ||
     !Number.isSafeInteger(t.version) || t.version<1 ||
     !t.title?.trim() || t.title.length>250 || !component.test(t.agencyComponentId) ||
     !t.recordsDescription?.trim() || t.recordsDescription.length<25 ||
     t.recordsDescription.length>6000 || !validDate(t.rangeStart) || !validDate(t.rangeEnd) ||
     (t.rangeStart!==null && t.rangeEnd!==null && t.rangeStart>t.rangeEnd) ||
     !Array.isArray(t.sourceIds) || t.sourceIds.length>100 ||
     t.sourceIds.some(id=>typeof id!=="string" || !/^[a-zA-Z0-9:_-]{3,160}$/.test(id)) ||
     !t.editorId?.trim() || t.editorId.length>255)
    throw Error("Invalid FOIA request template");
  if(t.state==="published" &&
    (!t.reviewerId?.trim() || t.reviewerId===t.editorId))
    throw Error("Independent publication review required");
}
export function validateTemplateHistory(versions:readonly RequestTemplate[]):void {
  if(!versions.length || versions.length>100)throw Error("Invalid template version history");
  const ordered=[...versions].sort((a,b)=>a.version-b.version);
  for(let i=0;i<ordered.length;i++){
    const t=ordered[i];
    validateRequestTemplate(t);
    if(t.version!==i+1 || t.templateId!==ordered[0].templateId)
      throw Error("Nonmonotonic template history");
    if(i>0 && ordered[i-1].state==="draft")
      throw Error("Unreviewed draft cannot be silently superseded");
  }
}
export function pinReviewedTemplate(template:RequestTemplate,subject:string):Readonly<PinnedRequestDraft> {
  validateRequestTemplate(template);
  if(template.state!=="published" || !subject?.trim() || subject.length>255)
    throw Error("Only reviewed templates may be adopted");
  // The full request text is copied. Later canonical revisions never mutate it.
  return Object.freeze({adoptionId:randomUUID(),adoptedBy:subject,
    templateId:template.templateId,templateVersion:template.version,
    title:template.title,agencyComponentId:template.agencyComponentId,
    recordsDescription:template.recordsDescription,
    rangeStart:template.rangeStart,rangeEnd:template.rangeEnd});
}
