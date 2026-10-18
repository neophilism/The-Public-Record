import {createHash,randomBytes} from "node:crypto";
import type {PendingOidcLogin} from "./oidc-login";
import type {PendingLoginStore} from "./oidc-exchange";

export interface SqlExecutor {
  query(sql:string,values:unknown[]):Promise<{rows:Record<string,unknown>[]}>;
}
function digest(value:string):string {return createHash("sha256").update(value).digest("hex");}
function validSecret(value:string):boolean {return /^[A-Za-z0-9_-]{43}$/.test(value);}
export function createBrowserBinding():string {return randomBytes(32).toString("base64url");}

/** Caller sets the browser binding in a Secure, HttpOnly, SameSite=Lax host cookie. */
export async function savePendingLogin(db:SqlExecutor,binding:string,login:PendingOidcLogin):Promise<void> {
  if(!validSecret(binding) || !validSecret(login.state) || !validSecret(login.nonce) ||
     !validSecret(login.codeVerifier) || !Number.isSafeInteger(login.expiresAt))
    throw new Error("Invalid login transaction");
  await db.query(`INSERT INTO tpr_private.oidc_login_transactions
    (state_sha256,browser_sha256,nonce,code_verifier,expires_at)
    VALUES ($1,$2,$3,$4,to_timestamp($5))`,
    [digest(login.state),digest(binding),login.nonce,login.codeVerifier,login.expiresAt]);
}
/** SQL DELETE RETURNING is atomic even when callbacks arrive concurrently. */
export function createPgPendingLoginStore(db:SqlExecutor,binding:string):PendingLoginStore {
  return {async consume(state:string) {
    if(!validSecret(binding) || !validSecret(state))return null;
    const result=await db.query(`DELETE FROM tpr_private.oidc_login_transactions
      WHERE state_sha256=$1 AND browser_sha256=$2 AND expires_at>now()
      RETURNING nonce,code_verifier,extract(epoch FROM expires_at)::bigint AS expires_at`,
      [digest(state),digest(binding)]);
    if(result.rows.length!==1)return null;
    const row=result.rows[0];
    return {state,nonce:String(row.nonce),codeVerifier:String(row.code_verifier),
      expiresAt:Number(row.expires_at)};
  }};
}
