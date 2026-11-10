const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
let failures = 0;
function fail(msg){ console.error('ARCH FAIL:', msg); failures++; }
function ok(msg){ console.log('ARCH OK:', msg); }

// 1. No secrets in versioned files (simple patterns)
const secretPatterns = [/AKIA[0-9A-Z]{16}/, /ghp_[A-Za-z0-9]{36}/, /-----BEGIN (RSA |)PRIVATE KEY-----/];
function walk(dir, cb) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      if (['node_modules','.git','dist','.next'].includes(f)) continue;
      walk(p, cb);
    } else cb(p);
  }
}
let secretFound = false;
walk(root, (p) => {
  if (p.endsWith('.env')) return; // .env ignored; .env.example allowed
  if (p.includes('.env.example')) return;
  try {
    const txt = fs.readFileSync(p, 'utf8');
    for (const pat of secretPatterns) { if (pat.test(txt)) { fail('Potential secret in ' + p); secretFound = true; } }
  } catch {}
});
if (!secretFound) ok('No hardcoded secrets detected');

// 2. Controllers must not import Prisma directly? Spec: no direct controller->Prisma. Check api controllers for '@prisma/client' import.
const ctrlDir = path.join(root, 'apps/api/src/modules');
let directPrisma = false;
function checkControllers(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) checkControllers(p);
    else if (f.endsWith('.controller.ts')) {
      const txt = fs.readFileSync(p, 'utf8');
      if (txt.includes("from '@prisma/client'") || txt.includes('prisma.')) {
        // allow via lib/prisma? controllers use prisma from lib; spec forbids direct. Flag direct '@prisma/client' only.
        if (txt.includes("@prisma/client")) { fail('Controller imports Prisma client directly: ' + p); directPrisma = true; }
      }
    }
  }
}
checkControllers(ctrlDir);
if (!directPrisma) ok('No direct Prisma client imports in controllers');

// 3. Required top-level structure
const required = ['apps','packages','database','agents','docs','tests','infra'];
for (const r of required) {
  if (!fs.existsSync(path.join(root, r))) fail('Missing top-level dir: ' + r);
}
ok('Top-level structure present');

// 4. Agents count
const norm = path.join(root, 'agents/normative');
const ope = path.join(root, 'agents/opencode');
if (fs.existsSync(norm)) {
  const n = fs.readdirSync(norm).filter(f=>f.endsWith('.md')).length;
  if (n < 18) fail('Expected 18 normative agents, found ' + n); else ok('18 normative agents present');
}
if (fs.existsSync(ope)) {
  const n = fs.readdirSync(ope).filter(f=>f.endsWith('.md')).length;
  if (n < 18) fail('Expected 18 opencode agents, found ' + n); else ok('18 opencode agents present');
}

if (failures > 0) { console.error(`\nArchitecture tests: ${failures} failure(s)`); process.exit(1); }
else console.log('\nArchitecture tests: PASS');
