import {createHash} from "node:crypto";
import {IdentityError} from "./oidc-id-token";
import type {VerifiedIdentity} from "./oidc-id-token";
import {issueSession,verifySession,type ValidSession} from "./session";
import type {SqlExecutor} from "./oidc-pending-store";

function digest(id:string):string {return createHash("sha256").update(id).digest("hex");}

/** Registration must finish before a session cookie is sent to the browser. */
export async function issueRegisteredSession(db:SqlExecutor,identity:VerifiedIdentity,secret:string,
  now=Math.floor(Date.now()/1000)):Promise<ValidSession & {token:string}> {
  const member=await db.query(`INSERT INTO tpr_private.oidc_members (issuer,subject)
    VALUES ($1,$2)
    ON CONFLICT (issuer,subject) DO UPDATE SET last_login_at=now()
      WHERE tpr_private.oidc_members.disabled_at IS NULL
    RETURNING issuer,subject`,[identity.issuer,identity.subject]);
  if(member.rows.length!==1)throw new IdentityError();
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
  const result=await db.query(`SELECT s.issuer,s.subject FROM tpr_private.oidc_sessions AS s
    JOIN tpr_private.oidc_members AS m
      ON m.issuer=s.issuer AND m.subject=s.subject
    WHERE s.sid_sha256=$1 AND s.revoked_at IS NULL AND s.expires_at>to_timestamp($2)
      AND m.disabled_at IS NULL`,
    [digest(session.id),now]);
  return result.rows.length===1 && result.rows[0].issuer===session.issuer &&
    result.rows[0].subject===session.subject ? session:null;
}

export async function revokeRegisteredSession(db:SqlExecutor,id:string):Promise<void> {
  await db.query(`UPDATE tpr_private.oidc_sessions SET revoked_at=now()
    WHERE sid_sha256=$1 AND revoked_at IS NULL`,[digest(id)]);
}

/** Trusted account administration only: disable identity and revoke all sessions atomically. */
export async function disableMemberIdentity(db:SqlExecutor,issuer:string,subject:string):Promise<void> {
  if(!issuer.startsWith("https://") || !subject || subject.length>255)throw new IdentityError();
  await db.query(`WITH disabled AS (
    UPDATE tpr_private.oidc_members SET disabled_at=coalesce(disabled_at,now())
    WHERE issuer=$1 AND subject=$2 RETURNING issuer,subject
  )
  UPDATE tpr_private.oidc_sessions AS s SET revoked_at=coalesce(s.revoked_at,now())
  FROM disabled AS m WHERE s.issuer=m.issuer AND s.subject=m.subject`,[issuer,subject]);
}
