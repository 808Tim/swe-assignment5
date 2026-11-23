import type { Room, AvailabilityResult } from './types';

/** Minutes in one day (00:00–24:00). Single source for the time range used by the rule and the form helpers. */
export const MINUTE_LIMIT = 1440;
const MAX_DURATION = 120;

export function checkAvailability(
  room: Room,
  start: number,
  end: number,
  currentTime: number
): AvailabilityResult {
  // AC1: 0 <= start < end <= 1440 and start strictly after current time
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(currentTime)) {
    return { status: 'unavailable', reason: 'All time fields must be valid numbers.' };
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || !Number.isInteger(currentTime)) {
    return { status: 'unavailable', reason: 'Times must be whole minutes (e.g. 660).' };
  }

  if (start < 0 || end > MINUTE_LIMIT || currentTime < 0 || currentTime > MINUTE_LIMIT) {
    return {
      status: 'unavailable',
      reason: `Times must be within 0–${MINUTE_LIMIT} minutes (midnight to midnight).`,
    };
  }

  if (start >= end) {
    return { status: 'unavailable', reason: 'Start time must be earlier than end time.' };
  }

  if (start <= currentTime) {
    return {
      status: 'unavailable',
      reason: 'Start time must be strictly after the current time.',
    };
  }

  // AC2: reject bookings longer than 120 minutes
  if (end - start > MAX_DURATION) {
    return {
      status: 'unavailable',
      reason: `Booking duration exceeds the ${MAX_DURATION}-minute maximum.`,
    };
  }

  // AC3: reject when room is blocked
  if (room.blocked) {
    return { status: 'unavailable', reason: 'This room is currently blocked and cannot be booked.' };
  }

  // AC4: reject overlap; touching endpoints are allowed
  for (const booking of room.bookings) {
    const overlaps = start < booking.end && end > booking.start;
    if (overlaps) {
      return {
        status: 'unavailable',
        reason: `Overlaps existing booking ${booking.start}–${booking.end}.`,
      };
    }
  }

  return { status: 'available' };
}
