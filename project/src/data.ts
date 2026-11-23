import type { Room } from './types';

export const SAMPLE_ROOMS: Room[] = [
  {
    id: 'A101',
    name: 'Room A101',
    blocked: false,
    bookings: [{ start: 600, end: 660 }],
  },
  {
    id: 'B202',
    name: 'Room B202',
    blocked: false,
    bookings: [],
  },
  {
    id: 'C303',
    name: 'Room C303',
    blocked: true,
    bookings: [],
  },
];
