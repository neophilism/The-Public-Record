import {afterAll,beforeAll,describe,it,expect} from "vitest";
import pg from "pg";
import {randomBytes} from "node:crypto";
import {issueQuarantinePermit} from "../lib/storage/quarantine-permits";
import {claimQuarantineIntent} from "../lib/storage/quarantine-claim";
import {runMigrations} from "../scripts/migrate.mjs";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";

const connectionString=process.env.TEST_DATABASE_URL;
describe.skipIf(!connectionString)("PostgreSQL initial migration and privacy constraints",()=>{
  const db=new pg.Client({connectionString});
  beforeAll(async()=>{
    await db.connect();
    expect(await runMigrations(db)).toEqual(["0001_core.sql","0002_audit_consent.sql","0005_quarantine_permit_uses.sql","0006_quarantine_issuer.sql"]);
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
  it("claims an owned quarantine upload once and denies cross-owner claims",async()=>{
    const secret=randomBytes(32).toString("base64url");
    const permit=issueQuarantinePermit({issuer:"https://identity.example.gov",subject:"subject-A",
      ownerSubject:"subject-A",ownerIssuer:"https://identity.example.gov",
      draftId:"fixture-draft",mime:"application/pdf",bytes:1024},secret);
    const first=await claimQuarantineIntent(db,permit.token,{issuer:"https://identity.example.gov",subject:"subject-A"},secret);
    expect(first).toMatchObject({draftId:"fixture-draft",bytes:1024});
    expect(await claimQuarantineIntent(db,permit.token,"subject-A",secret)).toBeNull();
    expect(await claimQuarantineIntent(db,permit.token,{issuer:"https://identity.example.gov",subject:"subject-B"},secret)).toBeNull();
    const missing=issueQuarantinePermit({subject:"subject-A",ownerSubject:"subject-A",
      draftId:"missing-draft",mime:"application/pdf",bytes:1024},secret);
    expect(await claimQuarantineIntent(db,missing.token,{issuer:"https://identity.example.gov",subject:"subject-A"},secret)).toBeNull();
  });
});
