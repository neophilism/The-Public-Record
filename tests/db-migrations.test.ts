import {afterAll,beforeAll,describe,it,expect} from "vitest";
import pg from "pg";
import {runMigrations} from "../scripts/migrate.mjs";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";

const connectionString=process.env.TEST_DATABASE_URL;
describe.skipIf(!connectionString)("PostgreSQL initial migration and privacy constraints",()=>{
  const db=new pg.Client({connectionString});
  beforeAll(async()=>{
    await db.connect();
    expect(await runMigrations(db)).toEqual(["0001_core.sql","0002_audit_consent.sql","0004_role_grant_events.sql","0005_issuer_scoped_private_rows.sql"]);
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
    await db.query("INSERT INTO tpr_private.request_drafts(id,owner_subject,owner_issuer,agency_component_id,draft_body) VALUES($1,$2,$3,$4,$5)",
      ["fixture-draft","subject-A","https://identity.example.gov","example-agency","Synthetic request"]);
    await expect(db.query(`INSERT INTO tpr_private.request_events
      (id,draft_id,owner_subject,owner_issuer,from_state,to_state,source)
      VALUES($1,$2,$3,$4,$5,$6,$7)`,
      ["bad-event","fixture-draft","subject-B","https://identity.example.gov","draft","submitted_unverified","requester_report"])
    ).rejects.toThrow();
    await expect(db.query(`INSERT INTO tpr_private.request_events
      (id,draft_id,owner_subject,owner_issuer,from_state,to_state,source)
      VALUES($1,$2,$3,$4,$5,$6,$7)`,
      ["bad-issuer-event","fixture-draft","subject-A","https://other.example.gov",
       "draft","submitted_unverified","requester_report"])
    ).rejects.toThrow();
  });
  it("applies owner-only row-level visibility to the runtime role",async()=>{
    await db.query("CREATE ROLE tpr_ci_reader NOLOGIN");
    await db.query("GRANT USAGE ON SCHEMA tpr_private TO tpr_ci_reader");
    await db.query("GRANT SELECT ON tpr_private.request_drafts TO tpr_ci_reader");
    await db.query(`INSERT INTO tpr_private.request_drafts
      (id,owner_subject,owner_issuer,agency_component_id,draft_body)
      VALUES ($1,$2,$3,$4,$5)`,
      ["other-issuer-draft","subject-A","https://other.example.gov","example-agency","Other private draft"]);
    await db.query("SET ROLE tpr_ci_reader");
    try{
      await db.query("SET tpr.subject = 'subject-A'");
      await db.query("SET tpr.issuer = 'https://identity.example.gov'");
      let result=await db.query("SELECT id FROM tpr_private.request_drafts");
      expect(result.rows.map(x=>x.id)).toEqual(["fixture-draft"]);
      await db.query("SET tpr.issuer = 'https://other.example.gov'");
      result=await db.query("SELECT id FROM tpr_private.request_drafts");
      expect(result.rows.map(x=>x.id)).toEqual(["other-issuer-draft"]);
      await db.query("SET tpr.issuer = 'https://identity.example.gov'");
      await db.query("SET tpr.subject = 'subject-B'");
      result=await db.query("SELECT id FROM tpr_private.request_drafts");
      expect(result.rows).toHaveLength(0);
      await db.query("RESET tpr.subject");
      result=await db.query("SELECT id FROM tpr_private.request_drafts");
      expect(result.rows).toHaveLength(0);
    }finally{await db.query("RESET ROLE");await db.query("RESET tpr.issuer")}
  });
  it("records auditable events without allowing silent edits or deletion",async()=>{
    const inserted=await db.query(`INSERT INTO tpr_private.audit_events
      (owner_subject,owner_issuer,actor_subject,action_code,object_kind,object_id,source_sha256)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      ["subject-A","https://identity.example.gov","subject-A","draft_created","request_draft","fixture-draft","a".repeat(64)]);
    const id=inserted.rows[0].id;
    await expect(db.query("UPDATE tpr_private.audit_events SET action_code=$1 WHERE id=$2",
      ["draft_updated",id])).rejects.toThrow("append-only");
    await expect(db.query("DELETE FROM tpr_private.audit_events WHERE id=$1",[id])).rejects.toThrow("append-only");
    const original=await db.query("SELECT action_code,object_id FROM tpr_private.audit_events WHERE id=$1",[id]);
    expect(original.rows[0]).toMatchObject({action_code:"draft_created",object_id:"fixture-draft"});
  });
  it("retains both grant and revocation events for one private object",async()=>{
    await db.query(`INSERT INTO tpr_private.quarantine_objects
      (id,draft_id,owner_subject,owner_issuer,private_storage_key,sha256)
      VALUES($1,$2,$3,$4,$5,$6)`,
      ["private-fixture","fixture-draft","subject-A","https://identity.example.gov","private/quarantine/v1/fixture-fixture","b".repeat(64)]);
    await db.query(`INSERT INTO tpr_private.consent_events
      (owner_subject,owner_issuer,quarantine_object_id,scope,event_action)
      VALUES($1,$2,$3,$4,$5),($1,$2,$3,$4,$6)`,
      ["subject-A","https://identity.example.gov","private-fixture","web_publication","granted","revoked"]);
    const r=await db.query(`SELECT event_action FROM tpr_private.consent_events
      WHERE quarantine_object_id=$1 ORDER BY id`,["private-fixture"]);
    expect(r.rows.map(x=>x.event_action).sort()).toEqual(["granted","revoked"]);
    await expect(db.query("DELETE FROM tpr_private.consent_events WHERE quarantine_object_id=$1",
      ["private-fixture"])).rejects.toThrow("append-only");
  });
  it("restricts role-grant reads by verified issuer and subject",async()=>{
    await db.query(`INSERT INTO tpr_private.role_grant_events
      (issuer,subject,role,event_action,actor_subject,reason)
      VALUES ($1,$2,$3,$4,$5,$6),($1,$7,$3,$4,$5,$6)`,
      ["https://identity.example.gov","role-person-A","requester","granted","bootstrap",
       "Synthetic test provisioning","role-person-B"]);
    await db.query("CREATE ROLE tpr_ci_roles NOLOGIN");
    await db.query("GRANT USAGE ON SCHEMA tpr_private TO tpr_ci_roles");
    await db.query("GRANT SELECT ON tpr_private.role_grant_events TO tpr_ci_roles");
    await db.query("SET ROLE tpr_ci_roles");
    try {
      await db.query("SET tpr.subject = 'role-person-A'");
      await db.query("SET tpr.issuer = 'https://identity.example.gov'");
      const visible=await db.query("SELECT subject FROM tpr_private.role_grant_events");
      expect(visible.rows.map(x=>x.subject)).toEqual(["role-person-A"]);
      await expect(db.query(`INSERT INTO tpr_private.role_grant_events
        (issuer,subject,role,event_action,actor_subject,reason)
        VALUES ('https://identity.example.gov','role-person-A','admin','granted','self','test')`))
        .rejects.toThrow();
    } finally {
      await db.query("RESET ROLE");
      await db.query("RESET tpr.subject");
      await db.query("RESET tpr.issuer");
    }
  });
  it("enforces issuer and subject isolation across all private row families",async()=>{
    await db.query(`INSERT INTO tpr_private.request_events
      (id,draft_id,owner_subject,owner_issuer,from_state,to_state,source)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      ["fixture-event","fixture-draft","subject-A","https://identity.example.gov",
       "draft","submitted_unverified","requester_report"]);
    await db.query(`INSERT INTO tpr_private.publication_grants
      (id,quarantine_object_id,owner_subject,owner_issuer,grant_status)
      VALUES ($1,$2,$3,$4,$5)`,
      ["fixture-grant","private-fixture","subject-A","https://identity.example.gov","granted"]);
    await db.query(`INSERT INTO tpr_private.retention_requests
      (owner_subject,owner_issuer,target_type,target_id)
      VALUES ($1,$2,$3,$4)`,
      ["subject-A","https://identity.example.gov","draft","fixture-draft"]);
    await db.query("CREATE ROLE tpr_ci_matrix NOLOGIN");
    await db.query("GRANT USAGE ON SCHEMA tpr_private TO tpr_ci_matrix");
    for(const table of ["request_drafts","request_events","quarantine_objects",
      "publication_grants","audit_events","consent_events","retention_requests"])
      await db.query("GRANT SELECT ON tpr_private."+table+" TO tpr_ci_matrix");
    await db.query("GRANT INSERT,UPDATE ON tpr_private.request_drafts TO tpr_ci_matrix");
    await db.query("SET ROLE tpr_ci_matrix");
    try {
      await db.query("SET tpr.subject = 'subject-A'");
      await db.query("SET tpr.issuer = 'https://identity.example.gov'");
      for(const table of ["request_drafts","request_events","quarantine_objects",
        "publication_grants","audit_events","consent_events","retention_requests"]) {
        const visible=await db.query("SELECT count(*)::int AS n FROM tpr_private."+table);
        expect(visible.rows[0].n).toBeGreaterThan(0);
      }
      await db.query("SET tpr.issuer = 'https://other.example.gov'");
      for(const table of ["request_events","quarantine_objects","publication_grants",
        "audit_events","consent_events","retention_requests"]) {
        const hidden=await db.query("SELECT count(*)::int AS n FROM tpr_private."+table);
        expect(hidden.rows[0].n).toBe(0);
      }
      const other=await db.query("SELECT id FROM tpr_private.request_drafts");
      expect(other.rows.map(x=>x.id)).toEqual(["other-issuer-draft"]);
      await db.query("SET tpr.issuer = 'https://identity.example.gov'");
      await expect(db.query(`INSERT INTO tpr_private.request_drafts
        (id,owner_subject,owner_issuer,draft_body)
        VALUES ($1,$2,$3,$4)`,
        ["forged-issuer","subject-A","https://other.example.gov","No access"]))
        .rejects.toThrow();
      const update=await db.query(`UPDATE tpr_private.request_drafts
        SET draft_body='tampered' WHERE id='other-issuer-draft'`);
      expect(update.rowCount).toBe(0);
    } finally {
      await db.query("RESET ROLE");
      await db.query("RESET tpr.subject");
      await db.query("RESET tpr.issuer");
    }
  });

});
