export interface Booking {
  start: number;
  end: number;
}

export interface Room {
  id: string;
  name: string;
  blocked: boolean;
  bookings: Booking[];
}

export type AvailabilityResult =
  | { status: 'available' }
  | { status: 'unavailable'; reason: string };
