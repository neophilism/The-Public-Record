import {describe,expect,it,vi} from "vitest";
import type {Pool,PoolClient} from "pg";
import {withRegisteredPrincipal,AuthenticationRequired} from "../lib/auth/registered-principal";
import type {ValidSession} from "../lib/auth/session";

const now=Math.floor(Date.now()/1000);
const session:ValidSession={id:"a".repeat(22),issuer:"https://identity.example.gov",
  subject:"person-A",issuedAt:now,expiresAt:now+900};
describe("registered private principal boundary",()=>{
  it("never opens a DB transaction for missing or unregistered cookies",async()=>{
    const connect=vi.fn();
    const pool={connect} as unknown as Pick<Pool,"connect">;
    const verify=vi.fn(async()=>null);
    await expect(withRegisteredPrincipal(pool,null,verify,async()=>true))
      .rejects.toThrow(AuthenticationRequired);
    await expect(withRegisteredPrincipal(pool,"signed-but-revoked",verify,async()=>true))
      .rejects.toThrow(AuthenticationRequired);
    expect(connect).not.toHaveBeenCalled();
    expect(verify).toHaveBeenCalledOnce();
  });
  it("loads server-owned roles only after registry verification",async()=>{
    const statements:string[]=[];
    const client={query:async(sql:string)=>{
      statements.push(sql);
      return {rows:sql.includes("SELECT role,event_action")?
        [{role:"requester",event_action:"granted"}]:[]};
    },release:vi.fn()} as unknown as PoolClient;
    const pool={connect:async()=>client} as unknown as Pick<Pool,"connect">;
    const verify=vi.fn(async(raw:unknown)=>raw==="registered-cookie"?session:null);
    const principal=await withRegisteredPrincipal(pool,"registered-cookie",verify,
      async(_db,value)=>value);
    expect(principal).toEqual({issuer:session.issuer,subject:session.subject,roles:["requester"]});
    expect(statements.at(-1)).toBe("COMMIT");
    expect(verify).toHaveBeenCalledWith("registered-cookie");
  });
});
