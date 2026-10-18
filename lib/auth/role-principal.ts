import type {Pool,PoolClient} from "pg";
import {roles,type Principal,type Role} from "./authorization";
import {withPrivateSubject} from "./private-transaction";
import type {ValidSession} from "./session";

/**
 * Caller must pass a session checked against the active session registry.
 * Role claims from browser input or OIDC tokens are never considered.
 */
export async function withRolePrincipal<T>(pool:Pick<Pool,"connect">,session:ValidSession,
  fn:(client:PoolClient,principal:Principal)=>Promise<T>):Promise<T> {
  return withPrivateSubject(pool,session,async client=>{
    await client.query("SELECT set_config('tpr.issuer',$1,true)",[session.issuer]);
    const result=await client.query(`SELECT role,event_action FROM (
      SELECT DISTINCT ON (role) role,event_action FROM tpr_private.role_grant_events
      WHERE issuer=$1 AND subject=$2 ORDER BY role,id DESC
    ) latest WHERE event_action='granted'`,[session.issuer,session.subject]);
    const active:Role[]=[];
    for(const row of result.rows) {
      if(typeof row.role!=="string" || !roles.includes(row.role as Role))
        throw new Error("Invalid stored role");
      active.push(row.role as Role);
    }
    return fn(client,{subject:session.subject,roles:active});
  });
}
