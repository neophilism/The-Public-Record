/**
 * Authorization is evaluated on verified backend identity and server-owned
 * role/object records. Never derive these fields from request JSON or an
 * unverified identity-provider role claim.
 */
export const roles = [
  "requester","contributor","researcher","editor","records_reviewer","moderator","admin","operator"
] as const;
export type Role = typeof roles[number];
export type Principal = { subject:string|null; roles:readonly Role[] };
export type Action = "read"|"create"|"update"|"delete"|"review"|"publish"|"manage"|"grant_role";
type AccessResource =
  | {kind:"question";published:boolean}
  | {kind:"agency_registry"}
  | {kind:"request_draft";owner:string}
  | {kind:"private_evidence";owner:string}
  | {kind:"consent_grant";owner:string}
  | {kind:"case_note";owner:string;assignedEditors:readonly string[]}
  | {kind:"publication_candidate";owner:string;assignedReviewers:readonly string[];ownerGrantedReview:boolean}
  | {kind:"audit_index"}
  | {kind:"role_assignment"};

function has(p:Principal,role:Role){return p.roles.includes(role);}
function authenticated(p:Principal) {
  return typeof p.subject==="string" && !!p.subject.trim() && p.subject.length<=255 &&
    Array.isArray(p.roles) && p.roles.every(role=>roles.includes(role));
}
function owns(p:Principal,owner:string){return authenticated(p) && p.subject===owner;}
export function authorize(p:Principal,action:Action,resource:AccessResource):boolean {
  if(!p || !resource || typeof resource!=="object")return false;
  // Published questions are public; drafts are never available to visitors.
  if(resource.kind==="question") {
    if(action==="read")return resource.published===true;
    return authenticated(p) && action==="create" && (has(p,"contributor")||has(p,"editor")||has(p,"admin"));
  }
  if(resource.kind==="agency_registry"){
    if(action==="read")return true;
    return authenticated(p) && action==="manage" && has(p,"admin");
  }
  if(!authenticated(p))return false;
  if(resource.kind==="request_draft"){
    return owns(p,resource.owner) && has(p,"requester") &&
      ["read","create","update","delete"].includes(action);
  }
  if(resource.kind==="private_evidence"){
    return owns(p,resource.owner) && has(p,"requester") &&
      ["read","create","delete"].includes(action);
  }
  if(resource.kind==="consent_grant"){
    return owns(p,resource.owner) && has(p,"requester") && ["read","update"].includes(action);
  }
  if(resource.kind==="case_note"){
    // Editors can work on assigned case notes but not underlying private evidence.
    return (owns(p,resource.owner) && action==="read") ||
      (has(p,"editor") && resource.assignedEditors.includes(p.subject!) &&
        ["read","update"].includes(action));
  }
  if(resource.kind==="publication_candidate"){
    // A records reviewer needs a separate scoped invitation and owner's consent.
    return has(p,"records_reviewer") && p.subject!==resource.owner &&
      resource.ownerGrantedReview===true && resource.assignedReviewers.includes(p.subject!) &&
      ["read","review"].includes(action);
  }
  if(resource.kind==="audit_index"){
    return action==="read" && (has(p,"admin")||has(p,"operator"));
  }
  if(resource.kind==="role_assignment"){
    // No in-band path for granting privileged roles. Separate offline bootstrap.
    return false;
  }
  return false;
}

/** Administrative role assignment must be documented, not inferred from OIDC. */
export function canAssignRole(actor:Principal,targetSubject:string,role:Role):boolean {
  return authenticated(actor) && has(actor,"admin") &&
    actor.subject!==targetSubject && typeof targetSubject==="string" &&
    targetSubject.trim().length>0 && targetSubject.length<=255 &&
    roles.includes(role) && !["admin","operator"].includes(role);
}
