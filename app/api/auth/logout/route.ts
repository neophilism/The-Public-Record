import {NextRequest,NextResponse} from "next/server";
import {revokeRegisteredSession} from "@/lib/auth/oidc-session-store";
import {SESSION_COOKIE_NAME,verifySession} from "@/lib/auth/session";
import {identityDatabase,identityErrorResponse,runtimeIdentityConfig} from "@/lib/auth/oidc-runtime";

export const runtime="nodejs";
export async function POST(request:NextRequest) {
  let config;
  try {config=runtimeIdentityConfig();} catch {return identityErrorResponse(503);}
  const expectedOrigin=new URL(config.redirectUri).origin;
  if(request.headers.get("origin")!==expectedOrigin)return identityErrorResponse(403);
  const token=request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session=verifySession(token,config.sessionSigningKey);
  if(session) {
    try {
      const db=await identityDatabase(config.databaseUrl);
      try {await revokeRegisteredSession(db,session.id);} finally {await db.end();}
    } catch {return identityErrorResponse(503);}
  }
  const response=NextResponse.json({authenticated:false},{headers:{"Cache-Control":"no-store"}});
  response.cookies.set(SESSION_COOKIE_NAME,"",{httpOnly:true,secure:true,
    sameSite:"lax",path:"/",maxAge:0});
  return response;
}
