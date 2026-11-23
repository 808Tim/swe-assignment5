// Assignment #05 mitigation for risk R-01: helper scripts must not write outside the repository.
// Before the fix, scripts/*.mjs resolved their output to `ROOT/../evidence` and overwrote files there.
import { describe, test, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SCRIPTS = resolve(__dirname, '..', 'scripts');
const files = readdirSync(SCRIPTS).filter((f) => f.endsWith('.mjs'));

describe('R-01 – scripts keep their output inside the repository', () => {
  test('there are helper scripts to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test.each(files)('%s: no output path is built from ROOT/..', (file) => {
    const source = readFileSync(join(SCRIPTS, file), 'utf8');
    expect(source).not.toMatch(/resolve\(\s*ROOT\s*,\s*['"]\.\.['"]/);
    expect(source).not.toMatch(/['"]\.\.['"]\s*,\s*['"]evidence['"]/);
  });
});
