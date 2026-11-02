import {afterAll,beforeAll,describe,it,expect} from "vitest";
import pg from "pg";
import {beginOidcLogin} from "../lib/auth/oidc-login";
import {createBrowserBinding,createPgPendingLoginStore,savePendingLogin} from "../lib/auth/oidc-pending-store";
import {issueRegisteredSession,verifyRegisteredSession,revokeRegisteredSession,disableMemberIdentity} from "../lib/auth/oidc-session-store";
import {randomBytes} from "node:crypto";
import {NextRequest} from "next/server";
import {GET as sessionRoute} from "../app/api/auth/session/route";
import {issueSession,SESSION_COOKIE_NAME} from "../lib/auth/session";
import {runMigrations} from "../scripts/migrate.mjs";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";

const connectionString=process.env.TEST_DATABASE_URL;
describe.skipIf(!connectionString)("PostgreSQL initial migration and privacy constraints",()=>{
  const db=new pg.Client({connectionString});
  beforeAll(async()=>{
    await db.connect();
    expect(await runMigrations(db)).toEqual(["0001_core.sql","0002_audit_consent.sql","0003_oidc_login.sql","0004_oidc_members.sql"]);
  });
  afterAll(async()=>{await db.end()});
  it("is idempotent and preserves migration digests",async()=>{
    expect(await runMigrations(db)).toEqual([]);
    const r=await db.query("SELECT name,sha256 FROM tpr_private.schema_migrations");
    expect(r.rows).toHaveLength(4);
    expect(r.rows[0].sha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it("rolls back an attempted rewrite of an already-applied migration",async()=>{
    const dir=mkdtempSync(path.join(tmpdir(),"tpr-drift-"));
    try{
      writeFileSync(path.join(dir,"0001_core.sql"),"-- an incompatible revision");
      await expect(runMigrations(db,dir)).rejects.toThrow("checksum changed");
      const r=await db.query("SELECT count(*)::int AS n FROM tpr_private.schema_migrations");
      expect(r.rows[0].n).toBe(4);
    }finally{rmSync(dir,{recursive:true,force:true})}
  });
  it("keeps public citations attached to real questions",async()=>{
    await db.query("INSERT INTO tpr_public.questions(id,slug,headline) VALUES($1,$2,$3)",
      ["fixture-q1","fictional-records","Which fictional records exist?"]);
    await expect(db.query(
      "INSERT INTO tpr_public.citations(id,question_id,source_url,source_label) VALUES($1,$2,$3,$4)",
      ["fixture-citation","missing-question","https://example.gov/records","Test fixture"])
    ).rejects.toThrow();
  });
  it("prevents private events from linking another owner's draft",async()=>{
    await db.query("INSERT INTO tpr_public.agencies(component_id,display_name,official_url,catalog_source) VALUES($1,$2,$3,$4)",
      ["example-agency","Fictional Agency","https://example.gov/records","fixture"]);
    await db.query("INSERT INTO tpr_private.request_drafts(id,owner_subject,agency_component_id,draft_body) VALUES($1,$2,$3,$4)",
      ["fixture-draft","subject-A","example-agency","Synthetic request"]);
    await expect(db.query(`INSERT INTO tpr_private.request_events
      (id,draft_id,owner_subject,from_state,to_state,source)
      VALUES($1,$2,$3,$4,$5,$6)`,
      ["bad-event","fixture-draft","subject-B","draft","submitted_unverified","requester_report"])
    ).rejects.toThrow();
  });
  it("applies owner-only row-level visibility to the runtime role",async()=>{
    await db.query("CREATE ROLE tpr_ci_reader NOLOGIN");
    await db.query("GRANT USAGE ON SCHEMA tpr_private TO tpr_ci_reader");
    await db.query("GRANT SELECT ON tpr_private.request_drafts TO tpr_ci_reader");
    await db.query("SET ROLE tpr_ci_reader");
    try{
      await db.query("SET tpr.subject = 'subject-A'");
      let result=await db.query("SELECT id FROM tpr_private.request_drafts");
      expect(result.rows.map(x=>x.id)).toContain("fixture-draft");
      await db.query("SET tpr.subject = 'subject-B'");
      result=await db.query("SELECT id FROM tpr_private.request_drafts");
      expect(result.rows).toHaveLength(0);
      await db.query("RESET tpr.subject");
      result=await db.query("SELECT id FROM tpr_private.request_drafts");
      expect(result.rows).toHaveLength(0);
    }finally{await db.query("RESET ROLE")}
  });
  it("records auditable events without allowing silent edits or deletion",async()=>{
    const inserted=await db.query(`INSERT INTO tpr_private.audit_events
      (owner_subject,actor_subject,action_code,object_kind,object_id,source_sha256)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
      ["subject-A","subject-A","draft_created","request_draft","fixture-draft","a".repeat(64)]);
    const id=inserted.rows[0].id;
    await expect(db.query("UPDATE tpr_private.audit_events SET action_code=$1 WHERE id=$2",
      ["draft_updated",id])).rejects.toThrow("append-only");
    await expect(db.query("DELETE FROM tpr_private.audit_events WHERE id=$1",[id])).rejects.toThrow("append-only");
    const original=await db.query("SELECT action_code,object_id FROM tpr_private.audit_events WHERE id=$1",[id]);
    expect(original.rows[0]).toMatchObject({action_code:"draft_created",object_id:"fixture-draft"});
  });
  it("retains both grant and revocation events for one private object",async()=>{
    await db.query(`INSERT INTO tpr_private.quarantine_objects
      (id,draft_id,owner_subject,private_storage_key,sha256)
      VALUES($1,$2,$3,$4,$5)`,
      ["private-fixture","fixture-draft","subject-A","private/quarantine/v1/fixture-fixture","b".repeat(64)]);
    await db.query(`INSERT INTO tpr_private.consent_events
      (owner_subject,quarantine_object_id,scope,event_action)
      VALUES($1,$2,$3,$4),($1,$2,$3,$5)`,
      ["subject-A","private-fixture","web_publication","granted","revoked"]);
    const r=await db.query(`SELECT event_action FROM tpr_private.consent_events
      WHERE quarantine_object_id=$1 ORDER BY id`,["private-fixture"]);
    expect(r.rows.map(x=>x.event_action).sort()).toEqual(["granted","revoked"]);
    await expect(db.query("DELETE FROM tpr_private.consent_events WHERE quarantine_object_id=$1",
      ["private-fixture"])).rejects.toThrow("append-only");
  });
  it("binds OIDC state to one browser and consumes it once",async()=>{
    const config={issuer:"https://login.example.gov",authorizationEndpoint:"https://login.example.gov/auth",
      clientId:"record",redirectUri:"https://record.example.org/callback"};
    const login=beginOidcLogin(config,Math.floor(Date.now()/1000));
    const binding=createBrowserBinding();
    await savePendingLogin(db,binding,login);
    expect(await createPgPendingLoginStore(db,createBrowserBinding()).consume(login.state)).toBeNull();
    expect(await createPgPendingLoginStore(db,binding).consume(login.state)).toMatchObject({
      state:login.state,nonce:login.nonce,codeVerifier:login.codeVerifier});
    expect(await createPgPendingLoginStore(db,binding).consume(login.state)).toBeNull();
  });
  it("returns 401 for an unregistered signed cookie at the HTTP session boundary",async()=>{
    const now=Math.floor(Date.now()/1000);
    const signingKey=randomBytes(32).toString("base64url");
    const identity={issuer:"https://login.example.gov",subject:"never-registered",
      issuedAt:now,expiresAt:now+900};
    const forged=issueSession(identity,signingKey,now);
    const previous={database:process.env.DATABASE_URL,key:process.env.SESSION_SIGNING_KEY,
      issuer:process.env.OIDC_ISSUER,auth:process.env.OIDC_AUTHORIZATION_ENDPOINT,
      token:process.env.OIDC_TOKEN_ENDPOINT,jwks:process.env.OIDC_JWKS_URI,
      client:process.env.OIDC_CLIENT_ID,redirect:process.env.OIDC_REDIRECT_URI};
    Object.assign(process.env,{DATABASE_URL:connectionString,SESSION_SIGNING_KEY:signingKey,
      OIDC_ISSUER:"https://login.example.gov",
      OIDC_AUTHORIZATION_ENDPOINT:"https://login.example.gov/auth",
      OIDC_TOKEN_ENDPOINT:"https://login.example.gov/token",
      OIDC_JWKS_URI:"https://login.example.gov/keys",
      OIDC_CLIENT_ID:"public-record",
      OIDC_REDIRECT_URI:"https://record.example.org/api/auth/callback"});
    try {
      const request=new NextRequest("https://record.example.org/api/auth/session",{
        headers:{Cookie:SESSION_COOKIE_NAME+"="+forged.token}});
      const response=await sessionRoute(request);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({authenticated:false});
      expect(response.headers.get("cache-control")).toBe("no-store");
    } finally {
      for(const [name,value] of Object.entries({
        DATABASE_URL:previous.database,SESSION_SIGNING_KEY:previous.key,
        OIDC_ISSUER:previous.issuer,OIDC_AUTHORIZATION_ENDPOINT:previous.auth,
        OIDC_TOKEN_ENDPOINT:previous.token,OIDC_JWKS_URI:previous.jwks,
        OIDC_CLIENT_ID:previous.client,OIDC_REDIRECT_URI:previous.redirect
      })) {
        if(value===undefined)delete process.env[name];else process.env[name]=value;
      }
    }
  });
  it("keeps provider identities separate even with the same subject",async()=>{
    const now=Math.floor(Date.now()/1000);
    const secret=randomBytes(32).toString("base64url");
    const left={issuer:"https://provider-a.example.gov",subject:"same-subject",
      issuedAt:now,expiresAt:now+900};
    const right={...left,issuer:"https://provider-b.example.gov"};
    const a=await issueRegisteredSession(db,left,secret,now);
    const b=await issueRegisteredSession(db,right,secret,now);
    await disableMemberIdentity(db,left.issuer,left.subject);
    expect(await verifyRegisteredSession(db,a.token,secret,now)).toBeNull();
    expect(await verifyRegisteredSession(db,b.token,secret,now)).toMatchObject({
      issuer:right.issuer,subject:right.subject});
  });
  it("denies missing and revoked sessions despite a valid MAC",async()=>{
    const now=Math.floor(Date.now()/1000);
    const secret=randomBytes(32).toString("base64url");
    const identity={issuer:"https://login.example.gov",subject:"fixture-person",
      issuedAt:now,expiresAt:now+900};
    const issued=await issueRegisteredSession(db,identity,secret,now);
    expect(await verifyRegisteredSession(db,issued.token,secret,now)).toMatchObject({
      subject:"fixture-person"});
    await revokeRegisteredSession(db,issued.id);
    expect(await verifyRegisteredSession(db,issued.token,secret,now)).toBeNull();
  });
  it("disables an identity across sessions and rejects later login",async()=>{
    const now=Math.floor(Date.now()/1000);
    const secret=randomBytes(32).toString("base64url");
    const identity={issuer:"https://login.example.gov",subject:"fixture-disabled",
      issuedAt:now,expiresAt:now+900};
    const first=await issueRegisteredSession(db,identity,secret,now);
    const second=await issueRegisteredSession(db,identity,secret,now);
    await disableMemberIdentity(db,identity.issuer,identity.subject);
    expect(await verifyRegisteredSession(db,first.token,secret,now)).toBeNull();
    expect(await verifyRegisteredSession(db,second.token,secret,now)).toBeNull();
    await expect(issueRegisteredSession(db,identity,secret,now)).rejects.toThrow();
    const member=await db.query(
      "SELECT disabled_at FROM tpr_private.oidc_members WHERE issuer=$1 AND subject=$2",
      [identity.issuer,identity.subject]);
    expect(member.rows[0].disabled_at).not.toBeNull();
  });
});
