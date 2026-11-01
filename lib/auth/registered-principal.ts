import type {Pool,PoolClient} from "pg";
import type {Principal} from "./authorization";
import type {ValidSession} from "./session";
import {withRolePrincipal} from "./role-principal";

export type RegisteredSessionVerifier=(rawCookie:unknown)=>Promise<ValidSession|null>;
export class AuthenticationRequired extends Error {
  constructor(){super("Authentication required");this.name="AuthenticationRequired";}
}

/** Routes must provide a verifier backed by the active session registry. */
export async function withRegisteredPrincipal<T>(
  pool:Pick<Pool,"connect">,rawCookie:unknown,verify:RegisteredSessionVerifier,
  fn:(client:PoolClient,principal:Principal)=>Promise<T>
):Promise<T> {
  if(typeof rawCookie!=="string" || !rawCookie || rawCookie.length>2500)
    throw new AuthenticationRequired();
  const session=await verify(rawCookie);
  if(!session)throw new AuthenticationRequired();
  return withRolePrincipal(pool,session,fn);
}
