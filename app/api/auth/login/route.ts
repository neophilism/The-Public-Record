import {NextResponse} from "next/server";
import {beginOidcLogin} from "@/lib/auth/oidc-login";
import {createBrowserBinding,savePendingLogin} from "@/lib/auth/oidc-pending-store";
import {identityDatabase,identityErrorResponse,LOGIN_COOKIE_NAME,runtimeIdentityConfig} from "@/lib/auth/oidc-runtime";

export const runtime="nodejs";
export async function GET() {
  let config;
  try {config=runtimeIdentityConfig();} catch {return identityErrorResponse(503);}
  try {
    const login=beginOidcLogin(config);
    const binding=createBrowserBinding();
    const db=await identityDatabase(config.databaseUrl);
    try {await savePendingLogin(db,binding,login);} finally {await db.end();}
    const response=NextResponse.redirect(login.authorizationUrl,303);
    response.headers.set("Cache-Control","no-store");
    response.headers.set("Referrer-Policy","no-referrer");
    response.cookies.set(LOGIN_COOKIE_NAME,binding,{httpOnly:true,secure:true,
      sameSite:"lax",path:"/",maxAge:300});
    return response;
  } catch {return identityErrorResponse(503);}
}
