// Pure helpers between the form (strings) and the booking rule (numbers).
// Moved out of App.tsx without changing behavior, so they can be tested without rendering the page.

export type ParsedRequest =
  | { ok: true; start: number; end: number; current: number }
  | { ok: false; reason: string };

/** Turns the three form fields into numbers. Empty fields are rejected before the booking rule runs. */
export function parseRequest(currentStr: string, startStr: string, endStr: string): ParsedRequest {
  if (startStr === '' || endStr === '' || currentStr === '') {
    return { ok: false, reason: 'Please fill in all three time fields.' };
  }
  return { ok: true, start: Number(startStr), end: Number(endStr), current: Number(currentStr) };
}

/** Minutes after midnight → "HH:MM". */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Text for the "Requested slot" hint, or null when the range is not well-formed yet. */
export function requestedSlotLabel(startStr: string, endStr: string): string | null {
  if (startStr === '' || endStr === '') return null;
  const start = Number(startStr);
  const end = Number(endStr);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  if (start < 0 || end > 1440 || start >= end) return null;
  return `${formatTime(start)} – ${formatTime(end)} (${end - start} min)`;
}
