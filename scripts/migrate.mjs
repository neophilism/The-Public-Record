import {createHash} from "node:crypto";
import {readFileSync,readdirSync} from "node:fs";
import {fileURLToPath,pathToFileURL} from "node:url";
import path from "node:path";
import pg from "pg";

const migrationDir=fileURLToPath(new URL("../db/migrations/",import.meta.url));

export async function runMigrations(client,directory=migrationDir) {
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(836102)");
    await client.query("CREATE SCHEMA IF NOT EXISTS tpr_private");
    await client.query(`CREATE TABLE IF NOT EXISTS tpr_private.schema_migrations (
      name text PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const files=readdirSync(directory).filter(f=>/^\d{4}_[a-z0-9_-]+\.sql$/.test(f)).sort();
    if(!files.length)throw Error("No migrations available");
    const applied=[];
    for(const name of files){
      const sql=readFileSync(path.join(directory,name),"utf8");
      const digest=createHash("sha256").update(sql).digest("hex");
      const prior=await client.query("SELECT sha256 FROM tpr_private.schema_migrations WHERE name=$1",[name]);
      if(prior.rows.length){
        if(prior.rows[0].sha256!==digest)throw Error("Applied migration checksum changed: "+name);
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO tpr_private.schema_migrations(name,sha256) VALUES($1,$2)",[name,digest]);
      applied.push(name);
    }
    await client.query("COMMIT");
    return applied;
  }catch(error){await client.query("ROLLBACK");throw error}
}

if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  if(!process.env.DATABASE_URL)throw Error("DATABASE_URL is required for explicit migrations");
  const client=new pg.Client({connectionString:process.env.DATABASE_URL});
  try{await client.connect();const applied=await runMigrations(client);console.log("Applied migrations:",applied.length)}
  finally{await client.end()}
}
