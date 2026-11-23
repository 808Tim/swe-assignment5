// Mutation challenge (Task #06).
// For each mutant: copy the project to a temporary folder, apply ONE small defect to
// src/checkAvailability.ts, run a suite there (tests unchanged), and record which tests fail.
// The real source in this project is never modified.
//
// Usage: node scripts/mutate.mjs            (improved suite)
//        node scripts/mutate.mjs --first    (original first suite)
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = resolve(import.meta.dirname, '..');
const TARGET = 'src/checkAvailability.ts';
const FIRST = process.argv.includes('--first');

const MUTANTS = [
  { id: 'M1', desc: 'Reject duration >= 120 instead of > 120', expect: 'T06',
    from: 'end - start > MAX_DURATION', to: 'end - start >= MAX_DURATION' },
  { id: 'M2', desc: 'Treat touching endpoints as an overlap', expect: 'T01 or T08',
    from: 'start < booking.end && end > booking.start', to: 'start <= booking.end && end >= booking.start' },
  { id: 'M3', desc: 'Remove the blocked-room rejection', expect: 'T13',
    from: 'if (room.blocked) {', to: 'if (false) {' },
  // Extra mutants (own), aimed at the extra cases.
  { id: 'M4', desc: 'Reject end == 1440 (end >= limit)', expect: 'T17',
    from: 'end > MINUTE_LIMIT', to: 'end >= MINUTE_LIMIT' },
  { id: 'M5', desc: 'Allow start == now (start < now)', expect: 'T02',
    from: 'start <= currentTime', to: 'start < currentTime' },
  { id: 'M6', desc: 'Only check the first booking', expect: 'T19',
    from: 'for (const booking of room.bookings)', to: 'for (const booking of room.bookings.slice(0, 1))' },
  { id: 'M7', desc: 'Save the checked slot into bookings (breaks AC5)', expect: 'T15/T16/any',
    from: "return { status: 'available' };", to: "room.bookings.push({ start, end });\n  return { status: 'available' };" },
  // Practice #08: BUG-B as a mutant (in-place sort). The Practice #07 suite missed it.
  { id: 'M8', desc: 'BUG-B: sort room.bookings in place', expect: 'R-B1/R-B2/R-B3',
    from: 'for (const booking of room.bookings)', to: 'for (const booking of room.bookings.sort((a, b) => a.start - b.start))' },
];

function runSuite(dir) {
  const args = ['vitest', 'run', '--reporter=json'];
  if (FIRST) args.push('--config', 'vitest.first.config.ts');
  const r = spawnSync('npx', args, { cwd: dir, encoding: 'utf8', shell: true });
  const start = r.stdout.indexOf('{');
  const json = JSON.parse(r.stdout.slice(start));
  const tests = json.testResults.flatMap((f) => f.assertionResults);
  const failed = tests.filter((t) => t.status === 'failed');
  const loadErrors = json.testResults.filter((f) => f.status === 'failed' && f.assertionResults.length === 0);
  return {
    total: tests.length,
    failed: failed.map((t) => (t.title.match(/^[TI]\d+/) ?? [t.title])[0]),
    messages: failed.map((t) => `${t.title}: ${(t.failureMessages[0] ?? '').split('\n')[0]}`),
    loadErrors: loadErrors.map((f) => f.message),
  };
}

function makeCopy() {
  const dir = mkdtempSync(join(tmpdir(), 'mutant-'));
  cpSync(ROOT, dir, { recursive: true, filter: (p) => !p.includes('node_modules') });
  symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'), 'junction');
  return dir;
}

const original = readFileSync(join(ROOT, TARGET), 'utf8');
const lines = [];
const log = (s = '') => { console.log(s); lines.push(s); };

log(`Mutation log — suite: ${FIRST ? 'FIRST (original AI suite)' : 'IMPROVED'} — ${new Date().toISOString()}`);

// Baseline in a clean copy
let dir = makeCopy();
const base = runSuite(dir);
rmSync(dir, { recursive: true, force: true });
log(`Baseline (unmutated): ${base.total} tests, failed: [${base.failed.join(', ') || 'none'}]`);
log('');

let detected = 0;
for (const m of MUTANTS) {
  if (!original.includes(m.from)) throw new Error(`${m.id}: pattern not found`);
  dir = makeCopy();
  writeFileSync(join(dir, TARGET), original.replace(m.from, m.to));
  const r = runSuite(dir);
  rmSync(dir, { recursive: true, force: true });
  const newFails = r.failed.filter((id) => !base.failed.includes(id));
  const ok = r.loadErrors.length === 0 && newFails.length > 0;
  if (ok) detected++;
  log(`${m.id} — ${m.desc}`);
  log(`   change:   \`${m.from}\`  →  \`${m.to.replace('\n', ' ')}\``);
  log(`   expected to fail: ${m.expect}`);
  log(`   result:   ${ok ? 'DETECTED (killed)' : 'SURVIVED'} — new failing tests: [${newFails.join(', ') || 'none'}]`);
  if (r.loadErrors.length) log(`   load/syntax error (does not count): ${r.loadErrors.join('; ')}`);
  for (const msg of r.messages.filter((x) => newFails.some((id) => x.startsWith(id)))) log(`      ${msg}`);
  log('');
}

// Confirm the real file was never touched
const after = readFileSync(join(ROOT, TARGET), 'utf8');
log(`Detected: ${detected}/${MUTANTS.length} (required M1–M3 + extra M4–M7)`);
log(`Original ${TARGET} unchanged after trials: ${after === original}`);

const out = resolve(ROOT, '..', 'evidence', FIRST ? '10_mutation_log_first_suite.txt' : '10_mutation_log_final_suite.txt');
if (existsSync(resolve(ROOT, '..', 'evidence'))) writeFileSync(out, lines.join('\n') + '\n');
