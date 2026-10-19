import {describe,expect,it,vi} from "vitest";
import type {Pool,PoolClient} from "pg";
import {withRolePrincipal} from "../lib/auth/role-principal";
import {authorize,roles,type Principal} from "../lib/auth/authorization";
import type {ValidSession} from "../lib/auth/session";

const session:ValidSession={id:"test-id",issuer:"https://identity.example.gov",
  subject:"person-A",issuedAt:Math.floor(Date.now()/1000),expiresAt:Math.floor(Date.now()/1000)+900};
function mockPool(rows:{role:string;event_action:string}[]) {
  const statements:string[]=[];
  const release=vi.fn();
  const client={query:async(sql:string)=>{
    statements.push(sql);
    return {rows:sql.includes("SELECT role,event_action")?rows:[]};
  },release} as unknown as PoolClient;
  return {pool:{connect:async()=>client} as unknown as Pick<Pool,"connect">,
    statements,release};
}
describe("server-owned role loading",()=>{
  it("uses stored grants only, inside a scoped private transaction",async()=>{
    const {pool,statements,release}=mockPool([{role:"requester",event_action:"granted"}]);
    const principal=await withRolePrincipal(pool,session,async (_db,p)=>p);
    expect(principal).toEqual({issuer:session.issuer,subject:"person-A",roles:["requester"]});
    expect(statements).toEqual(["BEGIN","SELECT set_config('tpr.subject',$1,true)",
      "SELECT set_config('tpr.issuer',$1,true)",expect.stringContaining("SELECT role,event_action"),"COMMIT"]);
    expect(release).toHaveBeenCalledOnce();
  });
  it("fails closed on unexpected stored roles",async()=>{
    const {pool,statements}=mockPool([{role:"superuser",event_action:"granted"}]);
    await expect(withRolePrincipal(pool,session,async()=>true)).rejects.toThrow("Invalid stored role");
    expect(statements.at(-1)).toBe("ROLLBACK");
  });
  it("denies all foreign private object actions for every application role",()=>{
    for(const role of roles)for(const kind of ["request_draft","private_evidence","consent_grant"] as const)
      for(const action of ["read","create","update","delete","review","publish","manage","grant_role"] as const) {
        const p:Principal={issuer:session.issuer,subject:"person-B",roles:[role]};
        expect(authorize(p,action,{kind,owner:"person-A",ownerIssuer:session.issuer})).toBe(false);
      }
  });
});
