import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
const root=process.cwd();
const required=["package-lock.json","README.md","CONTRIBUTING.md","SECURITY.md","docs/DEVELOPMENT_PLAN.md",
  "docs/DECISIONS.md","docs/IMPLEMENTATION_STATUS.md","docs/P0_ACCEPTANCE.md",
  ".exechub/project.yml",".exechub/approved-pr-mapping.json","openapi/public-record-v1.json",
  "fixtures/investigations.synthetic.json","app/page.tsx"];
for(const path of required)if(!existsSync(resolve(root,path)))throw Error("Missing required file: "+path);
const manifest=readFileSync(resolve(root,".exechub/project.yml"),"utf8");
if(!/planned_prs:\s*52/.test(manifest)||!/repository:\s*neophilism\/The-Public-Record/.test(manifest))
  throw Error("Roadmap scope or repository mismatch");
const mapping=JSON.parse(readFileSync(resolve(root,".exechub/approved-pr-mapping.json"),"utf8"));
if(mapping.sourceRepository!=="neophilism/The-Public-Record" ||
  mapping.roadmapVersion!==1 || mapping.pullRequestNumbers?.length!==52 ||
  new Set(mapping.pullRequestNumbers.filter(Number.isInteger)).size !==
    mapping.pullRequestNumbers.filter(Number.isInteger).length)
  throw Error("Invalid approved PR mapping");
const sample=JSON.parse(readFileSync(resolve(root,"fixtures/investigations.synthetic.json"),"utf8"));
if(sample.synthetic!==true || sample.source!=="synthetic-fixture-not-real")
  throw Error("Missing synthetic fixture marker");
if(Number(process.versions.node.split(".")[0])<22)throw Error("Node.js 22+ is required");
console.log("Local baseline verified: 52 planned units, synthetic fixtures, no live service claim.");
