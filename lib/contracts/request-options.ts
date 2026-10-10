export interface PageOptions {page:number;limit:number}
export function validatePageOptions(input:{page?:unknown;limit?:unknown}):PageOptions {
  const page=input.page===undefined?1:input.page;
  const limit=input.limit===undefined?20:input.limit;
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) ||
      (page as number)<1 || (page as number)>10000 ||
      (limit as number)<1 || (limit as number)>100)
    throw new Error("Invalid pagination parameters");
  return {page:page as number,limit:limit as number};
}
/** Key syntax only, not storage-level uniqueness. */
export function validateIdempotencyKey(value:unknown):string {
  if (typeof value!=="string" || value.length<16 || value.length>128 ||
      !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid idempotency key");
  return value;
}
