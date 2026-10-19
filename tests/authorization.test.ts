import {describe,expect,it} from "vitest";
import {authorize,canAssignRole,type Principal} from "../lib/auth/authorization";
const issuer="https://identity.example.gov";
const otherIssuer="https://other.example.gov";
const principal=(subject:string|null,...grants:Principal["roles"][number][]):Principal=>
  ({issuer:subject?issuer:null,subject,roles:grants});
const foreign=(subject:string,...grants:Principal["roles"][number][]):Principal=>
  ({issuer:otherIssuer,subject,roles:grants});
const owned={owner:"person-A",ownerIssuer:issuer};
const visitor=principal(null);
const owner=principal("person-A","requester");
const other=principal("person-B","requester");
const reviewer=principal("reviewer-C","records_reviewer");
const admin=principal("admin-D","admin");
describe("TPR object-level authorization",()=>{
 it("allows published questions but not unpublished drafts",()=>{
   expect(authorize(visitor,"read",{kind:"question",published:true})).toBe(true);
   expect(authorize(visitor,"read",{kind:"question",published:false})).toBe(false);
   expect(authorize(visitor,"create",{kind:"question",published:false})).toBe(false);
 });
 it("denies cross-owner access even for privileged roles",()=>{
   const kinds=["request_draft","private_evidence","consent_grant"] as const;
   for(const kind of kinds)for(const actor of [other,admin,reviewer,
     principal("mod-E","moderator"),principal("operator-F","operator")]){
     expect(authorize(actor,"read",{kind,...owned})).toBe(false);
     expect(authorize(actor,"update",{kind,...owned})).toBe(false);
   }
 });
 it("denies a reused subject from a different issuer",()=>{
   for(const kind of ["request_draft","private_evidence","consent_grant"] as const)
     for(const action of ["read","create","update","delete"] as const)
       expect(authorize(foreign("person-A","requester"),action,{kind,...owned})).toBe(false);
 });
 it("lets the actual requester manage owned objects within role permissions",()=>{
   expect(authorize(owner,"read",{kind:"request_draft",...owned})).toBe(true);
   expect(authorize(owner,"create",{kind:"private_evidence",...owned})).toBe(true);
   expect(authorize(owner,"update",{kind:"private_evidence",...owned})).toBe(false);
   expect(authorize(owner,"update",{kind:"consent_grant",...owned})).toBe(true);
 });
 it("requires issuer-bound editor assignment for case notes",()=>{
   const editor=principal("editor-G","editor");
   const caseNote={kind:"case_note" as const,...owned,
     assignedEditors:[{issuer,subject:"editor-G"}]};
   expect(authorize(editor,"update",caseNote)).toBe(true);
   expect(authorize(foreign("editor-G","editor"),"read",caseNote)).toBe(false);
   expect(authorize(principal("editor-H","editor"),"read",caseNote)).toBe(false);
   expect(authorize(editor,"read",{kind:"private_evidence",...owned})).toBe(false);
 });
 it("requires consent and issuer-bound reviewer assignment",()=>{
   const candidate={kind:"publication_candidate" as const,...owned,
     assignedReviewers:[{issuer,subject:"reviewer-C"}],ownerGrantedReview:true};
   expect(authorize(reviewer,"review",candidate)).toBe(true);
   expect(authorize(foreign("reviewer-C","records_reviewer"),"review",candidate)).toBe(false);
   expect(authorize(reviewer,"review",{...candidate,ownerGrantedReview:false})).toBe(false);
   expect(authorize(principal("person-A","records_reviewer"),"review",candidate)).toBe(false);
   expect(authorize(reviewer,"publish",candidate)).toBe(false);
 });
 it("separates administration from private data access",()=>{
   expect(authorize(admin,"read",{kind:"audit_index"})).toBe(true);
   expect(authorize(admin,"manage",{kind:"agency_registry"})).toBe(true);
   expect(authorize(principal("tech","operator"),"read",{kind:"audit_index"})).toBe(true);
   expect(authorize(admin,"read",{kind:"private_evidence",...owned})).toBe(false);
 });
 it("denies role escalation, self-promotion and cross-issuer grants",()=>{
   expect(canAssignRole(admin,{issuer,subject:"new-person"},"editor")).toBe(true);
   expect(canAssignRole(admin,{issuer,subject:"admin-D"},"editor")).toBe(false);
   expect(canAssignRole(admin,{issuer:otherIssuer,subject:"new-person"},"editor")).toBe(false);
   expect(canAssignRole(admin,{issuer,subject:"new-person"},"admin")).toBe(false);
   expect(canAssignRole(admin,{issuer,subject:"new-person"},"operator")).toBe(false);
   expect(canAssignRole(owner,{issuer,subject:"person-B"},"editor")).toBe(false);
   expect(authorize(visitor,"grant_role",{kind:"role_assignment"})).toBe(false);
 });
});
