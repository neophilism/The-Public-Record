import {createHash} from "node:crypto";
import type {VerifiedIdentity} from "./oidc-id-token";
import {issueSession,verifySession,type ValidSession} from "./session";
import type {SqlExecutor} from "./oidc-pending-store";

function digest(id:string):string {return createHash("sha256").update(id).digest("hex");}

/** Registration must finish before a session cookie is sent to the browser. */
export async function issueRegisteredSession(db:SqlExecutor,identity:VerifiedIdentity,secret:string,
  now=Math.floor(Date.now()/1000)):Promise<ValidSession & {token:string}> {
  const session=issueSession(identity,secret,now);
  await db.query(`INSERT INTO tpr_private.oidc_sessions
    (sid_sha256,issuer,subject,expires_at) VALUES ($1,$2,$3,to_timestamp($4))`,
    [digest(session.id),session.issuer,session.subject,session.expiresAt]);
  return session;
}

/** A valid MAC alone grants no access: the session must still be active in storage. */
export async function verifyRegisteredSession(db:SqlExecutor,raw:unknown,secret:string,
  now=Math.floor(Date.now()/1000)):Promise<ValidSession|null> {
  const session=verifySession(raw,secret,now);
  if(!session)return null;
  const result=await db.query(`SELECT issuer,subject FROM tpr_private.oidc_sessions
    WHERE sid_sha256=$1 AND revoked_at IS NULL AND expires_at>to_timestamp($2)`,
    [digest(session.id),now]);
  return result.rows.length===1 && result.rows[0].issuer===session.issuer &&
    result.rows[0].subject===session.subject ? session:null;
}

export async function revokeRegisteredSession(db:SqlExecutor,id:string):Promise<void> {
  await db.query(`UPDATE tpr_private.oidc_sessions SET revoked_at=now()
    WHERE sid_sha256=$1 AND revoked_at IS NULL`,[digest(id)]);
}
