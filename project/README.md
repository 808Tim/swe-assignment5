# Smart Campus Room Availability Checker

A small React + TypeScript (Vite) single-page app. A student picks one of three fictional sample rooms,
enters the current time, start time and end time as minutes after midnight (e.g. `540` = 09:00) and gets
**Available** or **Unavailable** with a reason. It only checks availability: there is no backend, no login,
no database and no booking is saved.

## Requirements
- Node.js 20.11 or newer (the helper scripts use `import.meta.dirname`). Verified with Node v24.13.1 and npm 11.8.0.
- Microsoft Edge only for the optional browser screenshot script (`scripts/ui-check.mjs`).

## Setup
```bash
npm ci          # installs the exact versions from package-lock.json
```

## Commands
| Command | What it does |
|---|---|
| `npm run dev` | start the local dev server (Vite) |
| `npm test` | run unit, regression and page-integration tests (Vitest) |
| `npm run lint` | ESLint for `.ts`/`.tsx` files |
| `npm run typecheck` | TypeScript check of `src/` |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the built `dist/` locally |
| `npm run test:first` | original AI-generated first suite, kept as evidence; **expected to fail 1 test (T14)** |
| `npm run test:mutants` | mutation check of `src/checkAvailability.ts`; log written to `reports/` |
| `npm run build && node scripts/ui-check.mjs` | browser UI checks with screenshots in `reports/ui/` |

All script output goes to `reports/` inside this folder (git-ignored).

## Booking rules
- Times are whole minutes in 0–1440; start must be before end and strictly after the current time.
- Maximum duration is 120 minutes.
- A blocked room cannot be booked.
- A request must not overlap an existing booking; touching endpoints (660–720 next to 600–660) are allowed.
- Checking never changes the sample booking data.

## Project structure
```
src/main.tsx              entry point
src/App.tsx               page UI and state
src/bookingInput.ts       form strings → numbers, time formatting
src/checkAvailability.ts  booking rule (pure function)
src/data.ts               fictional sample rooms
src/types.ts              shared types
tests/                    Vitest tests (tests/first = evidence suite)
scripts/                  mutation and UI-check helpers
AGENTS.md                 rules for AI coding agents (CLAUDE.md imports it)
```
