/** Backend identity and server-owned grants only; never trust browser or token role claims. */
export const roles = [
  "requester","contributor","researcher","editor","records_reviewer","moderator","admin","operator"
] as const;
export type Role = typeof roles[number];
export type Identity = {issuer:string;subject:string};
export type Principal = {issuer:string|null;subject:string|null;roles:readonly Role[]};
export type Action = "read"|"create"|"update"|"delete"|"review"|"publish"|"manage"|"grant_role";
type Owned = {owner:string;ownerIssuer:string};
type AccessResource =
  | {kind:"question";published:boolean}
  | {kind:"agency_registry"}
  | ({kind:"request_draft"} & Owned)
  | ({kind:"private_evidence"} & Owned)
  | ({kind:"consent_grant"} & Owned)
  | ({kind:"case_note";assignedEditors:readonly Identity[]} & Owned)
  | ({kind:"publication_candidate";assignedReviewers:readonly Identity[];ownerGrantedReview:boolean} & Owned)
  | {kind:"audit_index"}
  | {kind:"role_assignment"};

function has(p:Principal,role:Role):boolean {return p.roles.includes(role);}
function authenticated(p:Principal):boolean {
  return typeof p.subject==="string" && !!p.subject.trim() && p.subject.length<=255 &&
    typeof p.issuer==="string" && p.issuer.startsWith("https://") &&
    Array.isArray(p.roles) && p.roles.every(role=>roles.includes(role));
}
function sameIdentity(p:Principal,identity:Identity):boolean {
  return authenticated(p) && p.issuer===identity.issuer && p.subject===identity.subject;
}
function owns(p:Principal,r:Owned):boolean {
  return sameIdentity(p,{issuer:r.ownerIssuer,subject:r.owner});
}
export function authorize(p:Principal,action:Action,resource:AccessResource):boolean {
  if(!p || !resource || typeof resource!=="object")return false;
  if(resource.kind==="question") {
    if(action==="read")return resource.published===true;
    return authenticated(p) && action==="create" &&
      (has(p,"contributor")||has(p,"editor")||has(p,"admin"));
  }
  if(resource.kind==="agency_registry"){
    if(action==="read")return true;
    return authenticated(p) && action==="manage" && has(p,"admin");
  }
  if(!authenticated(p))return false;
  if(resource.kind==="request_draft"){
    return owns(p,resource) && has(p,"requester") &&
      ["read","create","update","delete"].includes(action);
  }
  if(resource.kind==="private_evidence"){
    return owns(p,resource) && has(p,"requester") &&
      ["read","create","delete"].includes(action);
  }
  if(resource.kind==="consent_grant"){
    return owns(p,resource) && has(p,"requester") && ["read","update"].includes(action);
  }
  if(resource.kind==="case_note"){
    return (owns(p,resource) && action==="read") ||
      (has(p,"editor") && resource.assignedEditors.some(identity=>sameIdentity(p,identity)) &&
        ["read","update"].includes(action));
  }
  if(resource.kind==="publication_candidate"){
    return has(p,"records_reviewer") && !owns(p,resource) &&
      resource.ownerGrantedReview===true &&
      resource.assignedReviewers.some(identity=>sameIdentity(p,identity)) &&
      ["read","review"].includes(action);
  }
  if(resource.kind==="audit_index"){
    return action==="read" && (has(p,"admin")||has(p,"operator"));
  }
  if(resource.kind==="role_assignment")return false;
  return false;
}

/** Privileged roles require an independent offline provisioning path. */
export function canAssignRole(actor:Principal,target:Identity,role:Role):boolean {
  return authenticated(actor) && has(actor,"admin") &&
    !!target && target.issuer===actor.issuer &&
    typeof target.subject==="string" && !!target.subject.trim() &&
    target.subject.length<=255 && actor.subject!==target.subject &&
    roles.includes(role) && !["admin","operator"].includes(role);
}
