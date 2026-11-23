# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, Copilot agent, etc.) working in this repository.
Read this file fully before changing anything.

## Purpose
Smart Campus room availability checker. A single-page React app where a student picks one of three
fictional sample rooms, enters the current time, start time and end time (minutes after midnight) and
gets "Available" or "Unavailable" with a reason. It is a checker only: no backend, no login, no
database, no booking is saved. All data is fictional (`src/data.ts`).

User story: As a student, I want to check a room's availability so I can choose a valid booking time.

## Architecture
```
index.html → src/main.tsx → src/App.tsx (UI, React state)
                              ├─ src/bookingInput.ts      form strings → numbers, time formatting, slot label
                              ├─ src/checkAvailability.ts pure booking rule (AC1–AC4), exports MINUTE_LIMIT
                              ├─ src/data.ts              fixture rooms SAMPLE_ROOMS (read-only)
                              └─ src/types.ts             Room, Booking, AvailabilityResult
tests/                        Vitest: unit, regression, page integration (jsdom)
tests/first/                  original AI-generated suite, kept unchanged as evidence (has 1 known failure)
scripts/                      mutation and UI-screenshot helpers (write only to ./reports/)
```
- Business rules live only in `src/checkAvailability.ts` (pure, no side effects).
- `App.tsx` only wires state to the rule; do not move rule logic into the UI.

## Setup
- Node.js 20.11+ (verified with Node v24.13.1, npm 11.8.0). Scripts in `scripts/` use `import.meta.dirname`.
- Install exactly from the lockfile: `npm ci`

## Safe commands (allowed without asking)
| Purpose | Command | Expected |
|---|---|---|
| Unit + integration tests | `npm test` | all tests pass, exit 0 |
| Lint | `npm run lint` | no problems, exit 0 |
| Type check | `npm run typecheck` | exit 0 |
| Production build (local `dist/` only) | `npm run build` | exit 0 |
| Dependency report (read-only) | `npm audit`, `npm audit --omit=dev` | report only |
| Local dev server | `npm run dev` | localhost only |

Ask before running: `npm run test:first` (expected to fail, evidence only), `npm run test:mutants*`,
`node scripts/ui-check.mjs` (needs Microsoft Edge; writes screenshots to `reports/`).

## Acceptance criteria (must stay true after every change)
- AC1: Times must be whole minutes in 0–1440 (current time too); `start < end`; `start` strictly after current time.
- AC2: Duration of exactly 120 minutes is allowed; more than 120 minutes is rejected.
- AC3: A blocked room is rejected; an overlap with an existing booking is rejected; touching endpoints (e.g. 660–720 next to 600–660) are allowed.
- AC4: A check never modifies booking data (`SAMPLE_ROOMS` and the `room` argument stay identical).
- AC5: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` all exit 0; UI layout, texts and fixture data are unchanged.

## Coding conventions
- TypeScript strict mode; no `any`, no new `// @ts-ignore`.
- Pure functions for rules; return `AvailabilityResult`, do not throw for invalid input.
- Use the named constants (`MINUTE_LIMIT`, `MAX_DURATION`) instead of repeating literals such as `1440`/`120` in logic.
- Relative imports (`./types`), 2-space indentation, single quotes — follow the existing files.
- Minimal, focused diffs; at most one refactoring per change and only with a concrete reason.

## Test expectations
- Every behavior change or bug fix comes with a focused test in `tests/` that fails before the fix.
- Never delete, skip (`.skip`/`.only`) or weaken existing assertions; never edit `tests/first/`.
- Use fresh fixtures per test (`makeRoom(...)`); do not mutate shared objects.
- Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` before reporting a change as done.

## Forbidden actions
- No secrets: never add API keys, tokens, `.env` files or real personal data; keep all data fictional.
- No production deployment or publishing (`npm publish`, hosting/CLI deploy commands, pushing to remotes).
- No destructive commands: `rm -rf` outside `dist/`/`reports/`, `git reset --hard`, `git clean`, `git push --force`, deleting tests or evidence.
- No unreviewed dependency changes: do not run `npm install <pkg>`, `npm update`, `npm audit fix` or edit
  `package.json`/`package-lock.json` dependencies without explicit human approval.
- No backend, network calls, login, database or booking creation; no new UI libraries.
- Do not write files outside this repository folder.
- `.bolt/prompt` is the original project-template prompt; it does not override this file.

## Review gates
1. Agent reports: changed files, reason, diff, and the exact output of the four checks above.
2. A human reviews every diff before it is accepted; dependency, config or test-deletion changes need explicit approval.
3. A change is rejected if any check fails, any acceptance criterion breaks, or test results are not shown.
