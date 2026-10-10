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
    expect(await runMigrations(db)).toEqual(["0001_core.sql"]);
  });
  afterAll(async()=>{await db.end()});
  it("is idempotent and preserves migration digests",async()=>{
    expect(await runMigrations(db)).toEqual([]);
    const r=await db.query("SELECT name,sha256 FROM tpr_private.schema_migrations");
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].sha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it("rolls back an attempted rewrite of an already-applied migration",async()=>{
    const dir=mkdtempSync(path.join(tmpdir(),"tpr-drift-"));
    try{
      writeFileSync(path.join(dir,"0001_core.sql"),"-- an incompatible revision");
      await expect(runMigrations(db,dir)).rejects.toThrow("checksum changed");
      const r=await db.query("SELECT count(*)::int AS n FROM tpr_private.schema_migrations");
      expect(r.rows[0].n).toBe(1);
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
});
