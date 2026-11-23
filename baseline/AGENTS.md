# AGENTS.md

## Project
Smart Campus room availability checker; fictional sample rooms, fixed current time entered by the user, availability decision only.
User story: As a student, I want to check a room's availability so I can choose a valid booking time.

## Structure
- `src/checkAvailability.ts` – pure booking-rule function `checkAvailability(room, start, end, currentTime)`
- `src/data.ts` – fixture data (`SAMPLE_ROOMS`)
- `src/types.ts` – `Room`, `Booking`, `AvailabilityResult`
- `src/App.tsx` – UI (React + Tailwind)
- `tests/` – Vitest unit, regression and integration tests

## Constraints
Preserve AC1–AC6; no backend, login, database or booking creation.
- AC1: reject start >= end and past requests.
- AC2: reject durations longer than 120 minutes.
- AC3: reject a blocked room.
- AC4: reject overlaps; allow bookings touching only at endpoints.
- AC5–AC6: do not mutate booking data; retain clear desktop/mobile feedback.

## Engineering rules
Prefer pure functions and minimal changes; use at most 2 justified patterns.
Do not mutate booking fixtures; keep responsive UI feedback.
Do not change the existing UI layout, texts or fixture data.

## Commands
- Install: `npm install`
- Tests: `npx vitest run` (same as `npm test`)
- Type check: `npm run typecheck`
- Build: `npm run build`

## Verification
Run existing tests and add focused regression tests. Do not weaken or delete existing assertions.
Report changed files, rationale and test evidence.
