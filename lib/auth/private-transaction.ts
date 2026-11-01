import type {Pool,PoolClient} from "pg";
import type {ValidSession} from "./session";

/**
 * Every private SQL operation must run inside a transaction with a verified
 * application identity. The DB login role must NOT own data or BYPASSRLS.
 *
 * Caller must first verify the signed session against the active registry;
 * the shape/lifetime checks here are additional safeguards, never authentication.
 * This adds isolation; it does not replace policy checks in authorization.ts.
 */
export async function withPrivateSubject<T>(
  pool:Pick<Pool,"connect">,
  session:ValidSession,
  fn:(client:PoolClient)=>Promise<T>
):Promise<T>{
  if(!session)throw new Error("Authentication required");
  // Read once, so validation and SQL identity use the same primitive values.
  const {subject,issuer,id,issuedAt,expiresAt}=session;
  const now=Math.floor(Date.now()/1000);
  if(typeof subject!=="string" || !subject.trim() || subject.length>255 ||
     typeof issuer!=="string" || !issuer.startsWith("https://") ||
     typeof id!=="string" || !/^[A-Za-z0-9_-]{20,30}$/.test(id) ||
     !Number.isSafeInteger(issuedAt) || issuedAt<0 ||
     !Number.isSafeInteger(expiresAt) || expiresAt<=issuedAt ||
     issuedAt>now+30 || expiresAt<=now || expiresAt-issuedAt>900)
    throw new Error("Authentication required");
  const client=await pool.connect();
  let started=false,committing=false;
  let discard:Error|undefined;
  try{
    await client.query("BEGIN");started=true;
    await client.query("SELECT set_config('tpr.subject',$1,true)",[subject]);
    await client.query("SELECT set_config('tpr.issuer',$1,true)",[issuer]);
    const result=await fn(client);
    committing=true;await client.query("COMMIT");
    return result;
  }catch(error){
    if(!started||committing)discard=error instanceof Error?error:new Error("Transaction state uncertain");
    if(started)try{await client.query("ROLLBACK");}
    catch(rollbackError){discard=rollbackError instanceof Error?rollbackError:new Error("Rollback failed");}
    // Preserve the operation's error; rollback diagnostics must not mask it.
    throw error;
  }finally{client.release(discard);}
}

