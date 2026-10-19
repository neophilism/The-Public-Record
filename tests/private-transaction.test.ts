import {describe,it,expect,vi} from "vitest";
import type {Pool,PoolClient} from "pg";
import {withPrivateSubject} from "../lib/auth/private-transaction";

const session=(subject:string,expiresAt=Math.floor(Date.now()/1000)+100)=>
 ({subject,issuer:"https://identity.example.gov",expiresAt});
function mockPool() {
  const statements:{sql:string;args?:unknown[]}[]=[];
  const release=vi.fn();
  const client={query:async(sql:string,args?:unknown[])=>{
    statements.push({sql,args});return {rows:[]};
  },release} as unknown as PoolClient;
  const pool={connect:async()=>client} as unknown as Pick<Pool,"connect">;
  return {pool,statements,release};
}
describe("database subject context",()=>{
  it("scopes a private operation and transaction-local context to the trusted subject",async()=>{
    const {pool,statements,release}=mockPool();
    const output=await withPrivateSubject(pool,session("person-123"),async db=>{
      await db.query("SELECT 'only domain queries here'");
      return 12;
    });
    expect(output).toBe(12);
    expect(statements.map(x=>x.sql)).toEqual([
      "BEGIN","SELECT set_config('tpr.subject',$1,true)",
      "SELECT set_config('tpr.issuer',$1,true)",
      "SELECT 'only domain queries here'","COMMIT"
    ]);
    expect(statements[1].args).toEqual(["person-123"]);
    expect(statements[2].args).toEqual(["https://identity.example.gov"]);
    expect(release).toHaveBeenCalledOnce();
  });
  it("does not accept arbitrary raw request subjects or expired sessions",async()=>{
    const {pool,statements}=mockPool();
    await expect(withPrivateSubject(pool,session(""),async()=>true)).rejects.toThrow();
    await expect(withPrivateSubject(pool,session("person-A",1),async()=>true)).rejects.toThrow();
    expect(statements).toHaveLength(0);
  });
  it("rolls back on query failures without returning a pooled session with custom state",async()=>{
    const {pool,statements,release}=mockPool();
    await expect(withPrivateSubject(pool,session("person-123"),async()=>{throw Error("query denied")}))
      .rejects.toThrow("query denied");
    expect(statements.map(s=>s.sql)).toEqual(["BEGIN","SELECT set_config('tpr.subject',$1,true)",
      "SELECT set_config('tpr.issuer',$1,true)","ROLLBACK"]);
    expect(release).toHaveBeenCalledOnce();
  });
});
