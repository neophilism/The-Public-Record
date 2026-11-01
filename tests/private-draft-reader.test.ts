import {it,expect} from "vitest";
import type {Pool,PoolClient} from "pg";
import {createPrivateDraftReader} from "../lib/auth/private-draft-reader";
const now=Math.floor(Date.now()/1000),issuer="https://identity.example.gov";
const session={id:"a".repeat(22),issuer,subject:"person-A",issuedAt:now,expiresAt:now+100};
function fixture({valid=true,owner="person-A",ownerIssuer=issuer,role="requester",fail=false}={}){
 const queries:{sql:string;args?:unknown[]}[]=[];
 const client={query:async(sql:string,args?:unknown[])=>{
  queries.push({sql,args});
  if(fail)throw Error("private connection string must not leak");
  return {rows:sql.includes("SELECT role,event_action")?[{role,event_action:"granted"}]:
   sql.includes("FROM tpr_private.request_drafts")?[{id:"draft-1",owner_subject:owner,owner_issuer:ownerIssuer,
    draft_body:"Private test draft",state:"draft",updated_at:"2026-11-01T00:00:00Z"}]:[]};
 },release:()=>{}} as unknown as PoolClient;
 const pool={connect:async()=>client} as unknown as Pick<Pool,"connect">;
 return {queries,read:createPrivateDraftReader({pool,verifyRegisteredSession:async()=>valid?session:null})};
}
const request=(cookie="__Host-tpr_session=synthetic.token",method="GET")=>
 new Request("https://record.example/private/draft-1",{method,headers:{cookie,"x-role":"admin"}});
it("reads only the registered requester-owned record with private response headers",async()=>{
 const f=fixture(),response=await f.read(request(),"draft-1");
 expect(response.status).toBe(200);
 expect(response.headers.get("cache-control")).toBe("private, no-store");
 expect(await response.json()).toEqual({draft:{id:"draft-1",body:"Private test draft",state:"draft",updatedAt:"2026-11-01T00:00:00.000Z"}});
 expect(f.queries.find(q=>q.sql.includes("FROM tpr_private.request_drafts"))?.args).toEqual(["draft-1",issuer,"person-A"]);
});
it("rejects revoked or ambiguous cookies without touching private SQL",async()=>{
 for(const cookie of ["","__Host-tpr_session=one; __Host-tpr_session=two"]){
  const f=fixture();expect((await f.read(request(cookie),"draft-1")).status).toBe(401);expect(f.queries).toHaveLength(0);
 }
 const revoked=fixture({valid:false});expect((await revoked.read(request(),"draft-1")).status).toBe(401);
 expect(revoked.queries).toHaveLength(0);
});
it("denies foreign issuer/owner and privileged non-requester roles despite crafted headers",async()=>{
 for(const change of [{owner:"person-B"},{ownerIssuer:"https://other.example.gov"},{role:"admin"},{role:"operator"}]){
  const f=fixture(change),response=await f.read(request(),"draft-1");
  expect(response.status).toBe(404);expect(await response.text()).not.toContain("Private test draft");
 }
});
it("rejects writes and hides all unexpected database diagnostics",async()=>{
 const f=fixture();expect((await f.read(request(undefined,"POST"),"draft-1")).status).toBe(405);expect(f.queries).toHaveLength(0);
 const broken=fixture({fail:true}),response=await broken.read(request(),"draft-1");
 expect(response.status).toBe(503);expect(await response.text()).not.toContain("connection string");
});
