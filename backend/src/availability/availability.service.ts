import { Injectable } from '@nestjs/common';

export const BUSINESS_START_MINUTES = 8 * 60;
export const BUSINESS_END_MINUTES = 20 * 60;
export const SLOT_STEP_MINUTES = 30;
export const BUFFER_MINUTES = 30;
export const SLOT_HOLD_MINUTES = 10;

export type SlotState = 'available' | 'limited' | 'unavailable' | 'expired';

export interface TimeSlot {
  start: string;
  end: string;
  state: SlotState;
  remaining: number;
}

export interface OccupiedSlot {
  start: string;
  end: string;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':');
  return Number(h) * 60 + Number(m ?? 0);
}

export function toTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

@Injectable()
export class AvailabilityService {
  generateSlots(input: {
    date: string;
    durationMinutes: number;
    capacity: number;
    occupied: OccupiedSlot[];
    now?: Date;
  }): TimeSlot[] {
    const { date, durationMinutes, capacity, occupied } = input;
    const now = input.now ?? new Date();
    const slots: TimeSlot[] = [];
    const duration = Math.max(SLOT_STEP_MINUTES, durationMinutes);
    const todayIso = now.toISOString().slice(0, 10);
    const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    for (
      let start = BUSINESS_START_MINUTES;
      start + duration <= BUSINESS_END_MINUTES;
      start += SLOT_STEP_MINUTES
    ) {
      const end = start + duration;
      const overlapping = occupied.filter((o) => {
        const os = toMinutes(o.start) - BUFFER_MINUTES;
        const oe = toMinutes(o.end) + BUFFER_MINUTES;
        return start < oe && end > os;
      }).length;

      const remaining = Math.max(0, capacity - overlapping);
      let state: SlotState = 'available';
      if (date === todayIso && start <= nowMinutes + 60) state = 'expired';
      else if (remaining === 0) state = 'unavailable';
      else if (remaining === 1) state = 'limited';

      slots.push({
        start: toTime(start),
        end: toTime(Math.min(end, BUSINESS_END_MINUTES)),
        state,
        remaining,
      });
    }

    return slots;
  }

  upcomingDates(days = 14, from = new Date()): string[] {
    const out: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setUTCDate(d.getUTCDate() + i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }
}
