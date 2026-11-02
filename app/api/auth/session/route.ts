import {NextRequest} from "next/server";
import {verifyRegisteredSession} from "@/lib/auth/oidc-session-store";
import {SESSION_COOKIE_NAME} from "@/lib/auth/session";
import {identityDatabase,identityErrorResponse,runtimeIdentityConfig} from "@/lib/auth/oidc-runtime";

export const runtime="nodejs";
export async function GET(request:NextRequest) {
  let config;
  try {config=runtimeIdentityConfig();} catch {return identityErrorResponse(503);}
  try {
    const db=await identityDatabase(config.databaseUrl);
    try {
      const session=await verifyRegisteredSession(db,request.cookies.get(SESSION_COOKIE_NAME)?.value,
        config.sessionSigningKey);
      return Response.json(session?{authenticated:true,subject:session.subject,expiresAt:session.expiresAt}:
        {authenticated:false},{status:session?200:401,headers:{"Cache-Control":"no-store"}});
    } finally {await db.end();}
  } catch {return identityErrorResponse(503);}
}
