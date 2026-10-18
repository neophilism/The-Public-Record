export interface NotificationDb {
  query(sql:string,values:unknown[]):Promise<{rows:Record<string,unknown>[]}>;
}
export interface NotificationIntent {
  ownerSubject:string;
  idempotencyKey:string;
  linkPath:string;
}
/** Caller must use the same trusted transaction as the originating case event. */
export async function enqueueCaseUpdate(db:NotificationDb,intent:NotificationIntent):Promise<boolean> {
  if(!intent.ownerSubject || intent.ownerSubject.length>255 ||
     !/^[A-Za-z0-9_-]{16,128}$/.test(intent.idempotencyKey) ||
     !/^\/public-record\/[A-Za-z0-9/_-]{1,180}$/.test(intent.linkPath) ||
     intent.linkPath.includes("//"))throw new Error("Invalid notification intent");
  const result=await db.query(`INSERT INTO tpr_private.notification_outbox
    (owner_subject,category,idempotency_key,link_path)
    SELECT $1,'case_update',$2,$3 WHERE (
      SELECT event_action FROM tpr_private.notification_consent_events
      WHERE owner_subject=$1 AND category='case_update' ORDER BY id DESC LIMIT 1
    )='subscribed'
    ON CONFLICT (owner_subject,idempotency_key) DO NOTHING RETURNING id`,
    [intent.ownerSubject,intent.idempotencyKey,intent.linkPath]);
  return result.rows.length===1;
}

/** Retry schedule only; no provider is contacted by this module. */
export function nextNotificationRetry(attempts:number,nowSeconds:number):number|null {
  if(!Number.isSafeInteger(attempts) || attempts<1 || attempts>5 ||
     !Number.isSafeInteger(nowSeconds))throw new Error("Invalid notification attempt");
  if(attempts===5)return null;
  return nowSeconds+Math.min(3600,30*2**(attempts-1));
}
