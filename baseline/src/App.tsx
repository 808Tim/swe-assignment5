import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, DoorClosed, MapPin, CalendarClock, AlertCircle } from 'lucide-react';
import { SAMPLE_ROOMS } from './data';
import { checkAvailability } from './checkAvailability';
import { parseRequest, formatTime, requestedSlotLabel } from './bookingInput';
import type { AvailabilityResult } from './types';

function App() {
  const [roomId, setRoomId] = useState<string>(SAMPLE_ROOMS[0].id);
  const [startStr, setStartStr] = useState('');
  const [endStr, setEndStr] = useState('');
  const [currentStr, setCurrentStr] = useState('');
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  const selectedRoom = SAMPLE_ROOMS.find((r) => r.id === roomId)!;

  function handleCheck() {
    setResult(null);
    const request = parseRequest(currentStr, startStr, endStr);
    if (!request.ok) {
      setResult({ status: 'unavailable', reason: request.reason });
      return;
    }
    setResult(checkAvailability(selectedRoom, request.start, request.end, request.current));
  }

  const slotLabel = requestedSlotLabel(startStr, endStr);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-slate-800">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8 text-center sm:mb-10">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <MapPin className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Smart Campus Room Availability
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Check whether a campus room is available for your requested time slot.
          </p>
        </header>

        {/* Room cards */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Select a room
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {SAMPLE_ROOMS.map((room) => {
              const isSelected = room.id === roomId;
              const blockedBadge = room.blocked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  <AlertCircle className="h-3 w-3" /> Blocked
                </span>
              );
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    setRoomId(room.id);
                    setResult(null);
                  }}
                  className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-600/10'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <DoorClosed className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    {blockedBadge}
                  </div>
                  <span className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                    {room.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {room.bookings.length === 0
                      ? 'No existing bookings'
                      : `${room.bookings.length} booking${room.bookings.length > 1 ? 's' : ''}`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Existing bookings for selected room */}
        {selectedRoom.bookings.length > 0 && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
              <CalendarClock className="h-4 w-4 text-blue-600" />
              Existing bookings for {selectedRoom.name}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedRoom.bookings.map((b, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600"
                >
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {formatTime(b.start)} – {formatTime(b.end)}
                  <span className="text-slate-400">({b.start}–{b.end})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Input form */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Enter time details (minutes from midnight)
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="current-time" className="mb-1.5 block text-sm font-medium text-slate-700">
                Current time
              </label>
              <input
                id="current-time"
                type="number"
                min={0}
                max={1440}
                inputMode="numeric"
                placeholder="e.g. 540"
                value={currentStr}
                onChange={(e) => { setCurrentStr(e.target.value); setResult(null); }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-1 text-xs text-slate-400">0 = 00:00, 1440 = 24:00</p>
            </div>

            <div>
              <label htmlFor="start-time" className="mb-1.5 block text-sm font-medium text-slate-700">
                Start time
              </label>
              <input
                id="start-time"
                type="number"
                min={0}
                max={1440}
                inputMode="numeric"
                placeholder="e.g. 660"
                value={startStr}
                onChange={(e) => { setStartStr(e.target.value); setResult(null); }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-1 text-xs text-slate-400">Must be after current time</p>
            </div>

            <div>
              <label htmlFor="end-time" className="mb-1.5 block text-sm font-medium text-slate-700">
                End time
              </label>
              <input
                id="end-time"
                type="number"
                min={0}
                max={1440}
                inputMode="numeric"
                placeholder="e.g. 720"
                value={endStr}
                onChange={(e) => { setEndStr(e.target.value); setResult(null); }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="mt-1 text-xs text-slate-400">Max 120-min duration</p>
            </div>
          </div>

          {slotLabel && (
            <p className="mt-3 text-xs text-slate-500">Requested slot: {slotLabel}</p>
          )}

          <button
            onClick={handleCheck}
            className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99] sm:w-auto sm:px-8"
          >
            Check availability
          </button>
        </section>

        {/* Result */}
        {result && (
          <section className="mt-5">
            {result.status === 'available' ? (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
                <div>
                  <p className="text-base font-semibold text-emerald-800">Available</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    {selectedRoom.name} is available for the requested time slot. No existing bookings conflict with this interval.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5">
                <XCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
                <div>
                  <p className="text-base font-semibold text-red-800">Unavailable</p>
                  <p className="mt-1 text-sm text-red-700">{result.reason}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Footer note */}
        <footer className="mt-8 text-center text-xs text-slate-400">
          Checker only — no bookings are saved or confirmed. Sample data for demonstration.
        </footer>
      </div>
    </div>
  );
}

export default App;
