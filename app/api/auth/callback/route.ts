import {NextRequest,NextResponse} from "next/server";
import {completeOidcLogin} from "@/lib/auth/oidc-exchange";
import {createPgPendingLoginStore} from "@/lib/auth/oidc-pending-store";
import {createTrustedJwksResolver} from "@/lib/auth/trusted-jwks";
import {issueRegisteredSession} from "@/lib/auth/oidc-session-store";
import {SESSION_COOKIE_NAME} from "@/lib/auth/session";
import {identityDatabase,identityErrorResponse,LOGIN_COOKIE_NAME,runtimeIdentityConfig} from "@/lib/auth/oidc-runtime";

export const runtime="nodejs";
export async function GET(request:NextRequest) {
  let config;
  try {config=runtimeIdentityConfig();} catch {return identityErrorResponse(503);}
  const url=new URL(request.url);
  const state=url.searchParams.get("state");
  const code=url.searchParams.get("code");
  const binding=request.cookies.get(LOGIN_COOKIE_NAME)?.value;
  if(url.searchParams.has("error") || url.searchParams.getAll("state").length!==1 ||
     url.searchParams.getAll("code").length!==1 || !binding || !state || !code) {
    const response=identityErrorResponse();
    response.headers.append("Set-Cookie",`${LOGIN_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return response;
  }
  try {
    const db=await identityDatabase(config.databaseUrl);
    try {
      const identity=await completeOidcLogin(config,state,code,{
        pending:createPgPendingLoginStore(db,binding),
        keys:createTrustedJwksResolver({issuer:config.issuer,jwksUri:config.jwksUri})});
      const session=await issueRegisteredSession(db,identity,config.sessionSigningKey);
      const response=NextResponse.redirect(new URL("/",config.redirectUri),303);
      response.headers.set("Cache-Control","no-store");
      response.headers.set("Referrer-Policy","no-referrer");
      response.cookies.set(SESSION_COOKIE_NAME,session.token,{httpOnly:true,secure:true,
        sameSite:"lax",path:"/",maxAge:Math.max(1,session.expiresAt-Math.floor(Date.now()/1000))});
      response.cookies.set(LOGIN_COOKIE_NAME,"",{httpOnly:true,secure:true,
        sameSite:"lax",path:"/",maxAge:0});
      return response;
    } finally {await db.end();}
  } catch {
    const response=identityErrorResponse();
    response.headers.append("Set-Cookie",`${LOGIN_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
    return response;
  }
}
