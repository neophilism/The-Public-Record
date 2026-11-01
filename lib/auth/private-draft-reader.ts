import type {Pool} from "pg";
import {authorize} from "./authorization";
import {AuthenticationRequired,withRegisteredPrincipal,type RegisteredSessionVerifier} from "./registered-principal";
import {SESSION_COOKIE_NAME} from "./session";

const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"private, no-store",
  "Vary":"Cookie","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'"};
const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers});
/** Mount only with the durable active-session verifier; no default authentication exists. */
export function createPrivateDraftReader({pool,verifyRegisteredSession}:{
  pool:Pick<Pool,"connect">;verifyRegisteredSession:RegisteredSessionVerifier
}){
  if(!pool||typeof pool.connect!=="function"||typeof verifyRegisteredSession!=="function")
    throw new Error("Registered session configuration required");
  return async function readPrivateDraft(request:Request,draftId:string):Promise<Response>{
    if(request.method!=="GET")return new Response(null,{status:405,headers:{...headers,Allow:"GET"}});
    if(typeof draftId!=="string"||draftId.length<1||draftId.length>120||/[\u0000-\u001f\u007f]/.test(draftId))
      return reply(404,{error:"Not found"});
    const cookie=request.headers.get("cookie")??"";
    const tokens=cookie.length<=8192?cookie.split(";").map(part=>part.trim())
      .filter(part=>part.startsWith(SESSION_COOKIE_NAME+"=")):[];
    if(tokens.length!==1)return reply(401,{error:"Authentication required"});
    const token=tokens[0].slice(SESSION_COOKIE_NAME.length+1);
    try{
      const draft=await withRegisteredPrincipal(pool,token,verifyRegisteredSession,async(client,principal)=>{
        const rows=(await client.query(
          "SELECT id,owner_subject,owner_issuer,draft_body,state,updated_at FROM tpr_private.request_drafts WHERE id=$1 AND owner_issuer=$2 AND owner_subject=$3 AND octet_length(draft_body)<=200000 LIMIT 2",
          [draftId,principal.issuer,principal.subject])).rows;
        if(rows.length!==1)return null;
        const row=rows[0];
        if(!authorize(principal,"read",{kind:"request_draft",owner:row.owner_subject,ownerIssuer:row.owner_issuer})||
           row.id!==draftId||typeof row.draft_body!=="string"||Buffer.byteLength(row.draft_body)>200000)
          return null;
        return {id:row.id,body:row.draft_body,state:row.state,updatedAt:new Date(row.updated_at).toISOString()};
      });
      return draft?reply(200,{draft}):reply(404,{error:"Not found"});
    }catch(error){
      if(error instanceof AuthenticationRequired||error instanceof Error&&error.message==="Authentication required")
        return reply(401,{error:"Authentication required"});
      return reply(503,{error:"Private record temporarily unavailable"});
    }
  };
}
