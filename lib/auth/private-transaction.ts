import type {Pool,PoolClient} from "pg";
export interface ServerVerifiedSubject { readonly subject:string; readonly issuer:string; readonly expiresAt:number; }

/**
 * Every private SQL operation must run inside a transaction with a verified
 * application identity. The DB login role must NOT own data or BYPASSRLS.
 *
 * Identity must come from verifySession(), never a client-supplied subject.
 * This adds isolation; it does not replace policy checks in authorization.ts.
 */
export async function withPrivateSubject<T>(
  pool:Pick<Pool,"connect">,
  session:ServerVerifiedSubject,
  fn:(client:PoolClient)=>Promise<T>
):Promise<T>{
  if(!session || typeof session.subject!=="string" ||
     !session.subject.trim() || session.subject.length>255 ||
     !session.issuer?.startsWith("https://") || !Number.isSafeInteger(session.expiresAt) ||
     session.expiresAt<=Math.floor(Date.now()/1000))
    throw new Error("Authentication required");
  const client=await pool.connect();
  let started=false;
  try{
    await client.query("BEGIN");started=true;
    await client.query("SELECT set_config('tpr.subject',$1,true)",[session.subject]);
    await client.query("SELECT set_config('tpr.issuer',$1,true)",[session.issuer]);
    const result=await fn(client);
    await client.query("COMMIT");
    return result;
  }catch(error){
    if(started)await client.query("ROLLBACK");
    throw error;
  }finally{client.release();}
}
