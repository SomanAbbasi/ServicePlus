import React from "react";
import { Switch } from "@/frontend/components/ui/switch";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Clock, Plus, X } from "lucide-react";

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export interface TimeSlot {
  start: string;
  end: string;
}

export interface DaySchedule {
  day: string;
  enabled: boolean;
  slots: TimeSlot[];
}

export interface DaySlot {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
  slots?: TimeSlot[];
}

interface WeekSchedulePickerProps {
  slots?: DaySlot[] | DaySchedule[];
  onChange: (schedule: DaySchedule[]) => void;
}

export function WeekSchedulePicker({ slots = [], onChange }: WeekSchedulePickerProps) {
  // Normalize slots to DaySchedule[]
  const fullSchedule: DaySchedule[] = DAYS_OF_WEEK.map((day) => {
    const existing = (slots as any[])?.find((s) => s.day?.toLowerCase() === day.toLowerCase());
    if (existing) {
      const existingSlots = Array.isArray(existing.slots) && existing.slots.length > 0
        ? existing.slots
        : [{ start: existing.start || "08:00", end: existing.end || "17:00" }];
      return {
        day,
        enabled: Boolean(existing.enabled),
        slots: existingSlots,
      };
    }
    return {
      day,
      // By default all days are toggled OFF (disabled)
      enabled: false,
      slots: [{ start: "08:00", end: "17:00" }],
    };
  });

  const handleToggleDay = (day: string, enabled: boolean) => {
    const next = fullSchedule.map((d) => (d.day === day ? { ...d, enabled } : d));
    onChange(next);
  };

  const handleSlotTimeChange = (
    day: string,
    slotIndex: number,
    field: "start" | "end",
    val: string,
  ) => {
    const next = fullSchedule.map((d) => {
      if (d.day !== day) return d;
      const updatedSlots = [...d.slots];
      updatedSlots[slotIndex] = {
        ...updatedSlots[slotIndex],
        [field]: val,
      };
      return { ...d, slots: updatedSlots };
    });
    onChange(next);
  };

  const handleAddSlot = (day: string) => {
    const next = fullSchedule.map((d) => {
      if (d.day !== day) return d;
      return {
        ...d,
        slots: [...d.slots, { start: "09:00", end: "18:00" }],
      };
    });
    onChange(next);
  };

  const handleRemoveSlot = (day: string, slotIndex: number) => {
    const next = fullSchedule.map((d) => {
      if (d.day !== day) return d;
      const updatedSlots = d.slots.filter((_, idx) => idx !== slotIndex);
      return {
        ...d,
        slots: updatedSlots.length > 0 ? updatedSlots : [{ start: "08:00", end: "17:00" }],
      };
    });
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-slate-800">Week Slot</h3>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 divide-y divide-slate-100">
        {fullSchedule.map((dayItem) => (
          <div key={dayItem.day} className="py-4 first:pt-0 last:pb-0 space-y-3">
            {/* Day Header Row */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">{dayItem.day}</span>
              <Switch
                checked={dayItem.enabled}
                onCheckedChange={(checked) => handleToggleDay(dayItem.day, checked)}
                className="data-[state=checked]:bg-cyan-600"
              />
            </div>

            {/* Expanded Slots when Enabled */}
            {dayItem.enabled && (
              <div className="space-y-2.5 pt-1 ps-1 animate-in fade-in-50 duration-150">
                <div className="grid grid-cols-1 gap-2.5 max-w-xl">
                  {dayItem.slots.map((slot, sIdx) => (
                    <div key={sIdx} className="space-y-1.5">
                      {sIdx === 0 && (
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                          <span>Start Time</span>
                          <span>End Time</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex-1">
                          <Input
                            type="time"
                            value={slot.start}
                            onChange={(e) =>
                              handleSlotTimeChange(dayItem.day, sIdx, "start", e.target.value)
                            }
                            className="h-10 text-xs bg-white border-slate-200 rounded-lg ps-3 pe-8 font-medium"
                          />
                          <Clock className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        </div>

                        <div className="relative flex-1">
                          <Input
                            type="time"
                            value={slot.end}
                            onChange={(e) =>
                              handleSlotTimeChange(dayItem.day, sIdx, "end", e.target.value)
                            }
                            className="h-10 text-xs bg-white border-slate-200 rounded-lg ps-3 pe-8 font-medium"
                          />
                          <Clock className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        </div>

                        {dayItem.slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(dayItem.day, sIdx)}
                            className="size-9 grid place-items-center rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors shrink-0"
                            title="Remove Slot"
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddSlot(dayItem.day)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs h-8 px-3 rounded-lg shadow-2xs"
                  >
                    <Plus className="size-3.5 me-1" /> Add Slot
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
