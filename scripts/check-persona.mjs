/**
 * Fail / File: scripts/check-persona.mjs
 * Pembangun / Developer: Zrain
 * Dicipta / Created: 2026-11-04
 * Dikemas kini / Last updated: 2026-11-04
 * BM: Pastikan provenance meliputi semua fail source dan komen metadata sah.
 * EN: Ensure provenance covers every source file and metadata comments are valid.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

// BM: Untuk GitHub Actions gunakan fail tracked sahaja; untuk pakej ZIP tanpa .git gunakan registry.
// EN: Use tracked files in GitHub Actions; a Git-free exported ZIP relies on the registry.
const inventory=JSON.parse(readFileSync('FILE_PROVENANCE.json','utf8'));
const listed=inventory.files.map(x=>x.path).sort();
assert.equal(new Set(listed).size,listed.length,'Duplicate paths in provenance');
let tracked;
try {tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).split('\0').filter(Boolean).sort();}
catch {tracked=null;}
if(tracked){assert.deepEqual(listed,tracked,'Registry must cover every tracked source file');}

let inline=0;
for(const entry of inventory.files){
  assert.equal(entry.maintainer,'Zrain');
  assert.match(entry.created,/^20\d\d-\d\d-\d\d$/);
  assert.match(entry.lastUpdated,/^20\d\d-\d\d-\d\d$/);
  assert.ok(entry.createdEvidence);
  if(entry.policy==='strict-json')continue;
  const content=readFileSync(entry.path,'utf8');
  assert.match(content.slice(0,1500),/Pembangun\s*\/\s*Developer:\s*Zrain/,`Header missing: ${entry.path}`);
  assert.match(content.slice(0,1500),/Dicipta\s*\/\s*Created:/,`Creation missing: ${entry.path}`);
  assert.match(content.slice(0,1500),/Dikemas kini\s*\/\s*Last updated:/,`Updated missing: ${entry.path}`);
  assert.match(content.slice(0,1500),/BM:[\s\S]*?EN:/,`Bilingual description missing: ${entry.path}`);
  inline++;
}
console.log(`Zrain Console persona structure passed: ${listed.length} files, ${inline} inline headers.`);
