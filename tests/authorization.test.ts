import {describe,expect,it} from "vitest";
import {authorize,canAssignRole,type Principal} from "../lib/auth/authorization";
const principal=(subject:string|null, ...grants:Principal["roles"][number][]):Principal=>({subject,roles:grants});
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
 it("denies cross-owner access even for privileged application roles",()=>{
   const kinds=["request_draft","private_evidence","consent_grant"] as const;
   for(const kind of kinds)for(const actor of [other,admin,reviewer,principal("mod-E","moderator"),principal("operator-F","operator")]){
     expect(authorize(actor,"read",{kind,owner:"person-A"})).toBe(false);
     expect(authorize(actor,"update",{kind,owner:"person-A"})).toBe(false);
   }
 });
 it("lets the actual requester manage owned objects within role permissions",()=>{
   expect(authorize(owner,"read",{kind:"request_draft",owner:"person-A"})).toBe(true);
   expect(authorize(owner,"create",{kind:"private_evidence",owner:"person-A"})).toBe(true);
   expect(authorize(owner,"update",{kind:"private_evidence",owner:"person-A"})).toBe(false);
   expect(authorize(owner,"update",{kind:"consent_grant",owner:"person-A"})).toBe(true);
 });
 it("allows assigned case editors without access to raw private evidence",()=>{
   const editor=principal("editor-G","editor");
   const caseNote={kind:"case_note" as const,owner:"person-A",assignedEditors:["editor-G"]};
   expect(authorize(editor,"update",caseNote)).toBe(true);
   expect(authorize(principal("editor-H","editor"),"read",caseNote)).toBe(false);
   expect(authorize(editor,"read",{kind:"private_evidence",owner:"person-A"})).toBe(false);
 });
 it("requires consent and assignment for non-owner publication reviewers",()=>{
   const candidate={kind:"publication_candidate" as const,owner:"person-A",assignedReviewers:["reviewer-C"],ownerGrantedReview:true};
   expect(authorize(reviewer,"review",candidate)).toBe(true);
   expect(authorize(reviewer,"review",{...candidate,ownerGrantedReview:false})).toBe(false);
   expect(authorize(principal("other-reviewer","records_reviewer"),"review",candidate)).toBe(false);
   expect(authorize(principal("person-A","records_reviewer"),"review",candidate)).toBe(false);
   expect(authorize(reviewer,"publish",candidate)).toBe(false);
 });
 it("separates audited administration from private data access",()=>{
   expect(authorize(admin,"read",{kind:"audit_index"})).toBe(true);
   expect(authorize(admin,"manage",{kind:"agency_registry"})).toBe(true);
   expect(authorize(principal("tech","operator"),"read",{kind:"audit_index"})).toBe(true);
   expect(authorize(principal("tech","operator"),"manage",{kind:"agency_registry"})).toBe(false);
   expect(authorize(admin,"read",{kind:"private_evidence",owner:"person-A"})).toBe(false);
 });
 it("denies role escalation, self-promotion and unknown identities",()=>{
   expect(canAssignRole(admin,"new-person","editor")).toBe(true);
   expect(canAssignRole(admin,"admin-D","editor")).toBe(false);
   expect(canAssignRole(admin,"new-person","admin")).toBe(false);
   expect(canAssignRole(admin,"new-person","operator")).toBe(false);
   expect(canAssignRole(owner,"person-B","admin")).toBe(false);
   expect(authorize(visitor,"grant_role",{kind:"role_assignment"})).toBe(false);
 });
});
