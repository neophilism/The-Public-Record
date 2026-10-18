import {createHash} from "node:crypto";
import {validateQuarantinePermit} from "./quarantine-permits";

export interface QuarantineClaimDb {
  query(sql:string,values:unknown[]):Promise<{rows:Record<string,unknown>[]}>;
}
export interface ClaimedQuarantineIntent {
  objectKey:string;
  draftId:string;
  mime:string;
  bytes:number;
  expiresAt:number;
}
/**
 * Must run with a verified subject and least-privilege, subject-scoped DB role.
 * Only an existing owner draft can claim a token, once. Does not upload bytes.
 */
export async function claimQuarantineIntent(db:QuarantineClaimDb,token:unknown,
  verifiedSubject:string,secret:string,now=Math.floor(Date.now()/1000)):
  Promise<ClaimedQuarantineIntent|null> {
  const permit=validateQuarantinePermit(token,verifiedSubject,secret,now);
  if(!permit)return null;
  const nonceHash=createHash("sha256").update(permit.nonce).digest("hex");
  const result=await db.query(`WITH owned AS (
      SELECT 1 FROM tpr_private.request_drafts WHERE id=$2 AND owner_subject=$3
    ) INSERT INTO tpr_private.quarantine_permit_uses
      (nonce_sha256,draft_id,owner_subject,object_key,mime,reserved_bytes,expires_at)
      SELECT $1,$2,$3,$4,$5,$6,to_timestamp($7) FROM owned
      WHERE to_timestamp($7)>now()
      ON CONFLICT DO NOTHING RETURNING object_key`,
    [nonceHash,permit.draftId,verifiedSubject,permit.objectKey,permit.mime,
      permit.bytes,permit.expiresAt]);
  if(result.rows.length!==1)return null;
  return {objectKey:permit.objectKey,draftId:permit.draftId,mime:permit.mime,
    bytes:permit.bytes,expiresAt:permit.expiresAt};
}
