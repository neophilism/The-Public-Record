import {createHash} from "node:crypto";
export type ScanVerdict="clean"|"infected"|"unknown";
export interface ScanResult {verdict:ScanVerdict;engine:string;signatureVersion:string;}
export interface QuarantineResult {status:"quarantined";sha256:string;bytes:number;detectedMime:string;scan:ScanResult;}
const MAX_BYTES=50*1024*1024;
const MAX_SCAN_MS=15_000;

function sniff(bytes:Uint8Array):string|null {
  const head=Buffer.from(bytes.subarray(0,16));
  if(head.subarray(0,5).toString("ascii")==="%PDF-")return "application/pdf";
  if(head.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return "image/png";
  if(head.subarray(0,3).equals(Buffer.from([255,216,255])))return "image/jpeg";
  // Archives, including Office Open XML, need an isolated parser with expansion limits.
  if(head.subarray(0,2).toString("ascii")==="PK")return null;
  const text=Buffer.from(bytes).toString("utf8");
  if(Buffer.from(text,"utf8").equals(Buffer.from(bytes)) && !/[\u0000-\u0008\u000e-\u001f]/.test(text))return "text/plain";
  return null;
}

/** Pure ingress gate: the caller stores bytes only after this returns clean. */
export async function inspectQuarantineBytes(
  bytes:Uint8Array,declaredMime:string,
  scan:(bytes:Uint8Array)=>Promise<ScanResult>,timeoutMs=MAX_SCAN_MS
):Promise<QuarantineResult> {
  if(!(bytes instanceof Uint8Array)||bytes.byteLength<1||bytes.byteLength>MAX_BYTES)
    throw new Error("Upload size rejected");
  const detectedMime=sniff(bytes);
  if(!detectedMime||detectedMime!==declaredMime)throw new Error("Upload type rejected");
  if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>MAX_SCAN_MS)
    throw new Error("Invalid scanner timeout");
  let timer:ReturnType<typeof setTimeout>|undefined;
  try {
    const outcome=await Promise.race([
      scan(bytes),
      new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Scanner timeout")),timeoutMs)})
    ]);
    if(outcome?.verdict!=="clean"||!outcome.engine||!outcome.signatureVersion)
      throw new Error("Scanner did not clear upload");
    return {status:"quarantined",sha256:createHash("sha256").update(bytes).digest("hex"),
      bytes:bytes.byteLength,detectedMime,scan:outcome};
  }finally{if(timer)clearTimeout(timer)}
}
