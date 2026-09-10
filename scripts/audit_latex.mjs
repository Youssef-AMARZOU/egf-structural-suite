#!/usr/bin/env node
/** Headless KaTeX audit: renders EVERY LaTeX string in src/** with
 *  throwOnError:true. Any parse failure is a real "Math error:" risk.
 *  Exit code = number of failing formulas (0 = clean).
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const katex = require('katex');

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) yield p;
  }
}

const RE = /String\.raw`((?:[^`\\]|\\.)*)`/g;
let total = 0;
const failures = [];

for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, 'utf-8');
  let m;
  RE.lastIndex = 0;
  while ((m = RE.exec(src)) !== null) {
    const tex = m[1];
    if (!tex) continue;
    total++;
    try {
      katex.renderToString(tex, { throwOnError: true, strict: false, displayMode: true });
    } catch (err) {
      failures.push({ file: path.relative(ROOT, file), tex, error: String(err).split('\n')[0] });
    }
  }
}

console.log(`formulas audited: ${total}`);
if (failures.length === 0) {
  console.log('KA-TEX AUDIT CLEAN — zero Math error risks');
} else {
  console.log(`FAILURES: ${failures.length}`);
  for (const f of failures) {
    console.log(`--- ${f.file}\n  tex: ${f.tex}\n  err: ${f.error}`);
  }
}
process.exit(failures.length > 255 ? 255 : failures.length);
