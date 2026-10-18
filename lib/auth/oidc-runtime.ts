import pg from "pg";
import {IdentityError} from "./oidc-id-token";
import type {OidcExchangeConfig} from "./oidc-exchange";
import type {OidcLoginConfig} from "./oidc-login";

export interface RuntimeIdentityConfig extends OidcExchangeConfig,OidcLoginConfig {
  jwksUri:string;
  sessionSigningKey:string;
  databaseUrl:string;
}
export const LOGIN_COOKIE_NAME="__Host-tpr_login";

/** Disabled until the operator configures a real provider and separate DB credentials. */
export function runtimeIdentityConfig():RuntimeIdentityConfig {
  const config={issuer:process.env.OIDC_ISSUER,authorizationEndpoint:process.env.OIDC_AUTHORIZATION_ENDPOINT,
    tokenEndpoint:process.env.OIDC_TOKEN_ENDPOINT,jwksUri:process.env.OIDC_JWKS_URI,
    clientId:process.env.OIDC_CLIENT_ID,redirectUri:process.env.OIDC_REDIRECT_URI,
    sessionSigningKey:process.env.SESSION_SIGNING_KEY,databaseUrl:process.env.DATABASE_URL};
  if(Object.values(config).some(value=>!value))throw new IdentityError();
  return config as RuntimeIdentityConfig;
}

export async function identityDatabase(url:string):Promise<pg.Client> {
  const db=new pg.Client({connectionString:url,connectionTimeoutMillis:5000});
  await db.connect();
  return db;
}

export function identityErrorResponse(status=400):Response {
  return new Response("Identity request unavailable",{status,headers:{
    "Cache-Control":"no-store","Content-Type":"text/plain; charset=utf-8",
    "Referrer-Policy":"no-referrer"}});
}
