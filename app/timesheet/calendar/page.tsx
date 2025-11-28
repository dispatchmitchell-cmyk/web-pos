// FILE: app/timesheet/calendar/page.tsx
"use client";

import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import "./calendar-theme.css";

type StaffMember = {
  id: number;
  name: string;
  role_id: number;
  role_name: string;
};

type Roster = Record<string, number | null>;

type CalendarMeta = {
  blocked: boolean;
  hasNotes: boolean;
};

type CalendarAllRow = {
  date: string;
  blocked: boolean | null;
  notes: string | null;
};

const emptyRoster: Roster = {
  slot1: null,
  slot2: null,
  slot3: null,
  slot4: null,
  slot5: null,
  slot6: null,
  slot7: null,
  slot8: null,
  slot9: null,
  slot10: null,
};

const dayToKey = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

export default function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [notes, setNotes] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [roster, setRoster] = useState<Roster>(emptyRoster);

  // Map of dateKey -> { blocked, hasNotes } for coloring
  const [calendarMeta, setCalendarMeta] = useState<Record<string, CalendarMeta>>(
    {}
  );

  // Arrays of Date objects used by DayPicker modifiers
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [notedDates, setNotedDates] = useState<Date[]>([]);

  const dateKey = selectedDay ? dayToKey(selectedDay) : null;

  /** Helper: recompute modifier arrays whenever meta changes */
  const recomputeHighlights = (meta: Record<string, CalendarMeta>) => {
    const blockedArr: Date[] = [];
    const notedArr: Date[] = [];

    for (const [key, value] of Object.entries(meta)) {
      if (!key) continue;
      const jsDate = new Date(key);
      if (Number.isNaN(jsDate.getTime())) continue;

      if (value.blocked) blockedArr.push(jsDate);
      if (value.hasNotes) notedArr.push(jsDate);
    }

    setBlockedDates(blockedArr);
    setNotedDates(notedArr);
  };

  /* -------------------------------------------------
     LOAD STAFF
  --------------------------------------------------- */
  useEffect(() => {
    fetch("/api/staff/list")
      .then((r) => {
        if (!r.ok) throw new Error("Failed response");
        return r.json();
      })
      .then((d: StaffMember[]) => setStaff(d))
      .catch((e) => console.error("Failed to load staff", e));
  }, []);

  /* -------------------------------------------------
     LOAD ALL CALENDAR DAYS (for coloring)
  --------------------------------------------------- */
  useEffect(() => {
    fetch("/api/calendar/all")
      .then((r) => {
        if (!r.ok) throw new Error("Failed response");
        return r.json();
      })
      .then((rows: CalendarAllRow[]) => {
        const meta: Record<string, CalendarMeta> = {};

        rows.forEach((row) => {
          if (!row.date) return;
          const hasNotes =
            !!row.notes && row.notes.trim().toUpperCase() !== "EMPTY";

          meta[row.date] = {
            blocked: !!row.blocked,
            hasNotes,
          };
        });

        setCalendarMeta(meta);
        recomputeHighlights(meta);
      })
      .catch((e) => console.error("Failed to load calendar/all", e));
  }, []);

  /* -------------------------------------------------
     LOAD SINGLE DAY DATA (for right panel)
  --------------------------------------------------- */
  useEffect(() => {
    if (!dateKey) return;

    fetch(`/api/calendar/day?date=${dateKey}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed response");
        return r.json();
      })
      .then((data) => {
        if (!data) {
          setNotes("");
          setBlocked(false);
          setRoster(emptyRoster);
          return;
        }

        setNotes(data.notes ?? "");
        setBlocked(!!data.blocked);
        setRoster(data.roster ?? emptyRoster);
      })
      .catch((e) => console.error("Load day error:", e));
  }, [dateKey]);

  /* -------------------------------------------------
     SAVE DAY (roster & notes only)
  --------------------------------------------------- */
  const saveDay = async () => {
    if (!dateKey) return;

    try {
      await fetch("/api/calendar/day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          blocked,
          notes,
          roster,
        }),
      });

      // Update coloring metadata for this date
      setCalendarMeta((prev) => {
        const hasNotes =
          notes.trim() !== "" && notes.trim().toUpperCase() !== "EMPTY";

        const next: Record<string, CalendarMeta> = {
          ...prev,
          [dateKey]: {
            blocked,
            hasNotes,
          },
        };

        recomputeHighlights(next);
        return next;
      });
    } catch (e) {
      console.error("Failed to save day:", e);
    }
  };

  /* -------------------------------------------------
     TOGGLE BLOCKED (auto-save immediately)
  --------------------------------------------------- */
  const toggleBlocked = async () => {
    if (!dateKey) return;

    const newBlocked = !blocked;
    setBlocked(newBlocked);

    try {
      await fetch("/api/calendar/day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          blocked: newBlocked,
          notes,
          roster,
        }),
      });
    } catch (e) {
      console.error("Failed to auto-save blocked state:", e);
    }

    // Update metadata + coloring
    setCalendarMeta((prev) => {
      const hasNotes =
        notes.trim() !== "" && notes.trim().toUpperCase() !== "EMPTY";

      const next: Record<string, CalendarMeta> = {
        ...prev,
        [dateKey]: {
          blocked: newBlocked,
          hasNotes,
        },
      };

      recomputeHighlights(next);
      return next;
    });
  };

  /* -------------------------------------------------
     MODIFIERS for DayPicker (blocked + noted)
  --------------------------------------------------- */
  const modifiers = {
    blocked: blockedDates,
    noted: notedDates,
  };

  const modifiersStyles = {
    blocked: {
      backgroundColor: "#dc2626",
      color: "#ffffff",
      borderRadius: "9999px",
    },
    noted: {
      backgroundColor: "var(--accent)" as string,
      color: "#ffffff",
      borderRadius: "9999px",
    },
  };

  return (
    <div className="pt-24 px-6 pb-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Calendar</h1>

      <div className="flex gap-10">
        {/* CALENDAR */}
        <div className="bg-slate-800 rounded-lg p-6 shadow border border-slate-700">
          <DayPicker
            mode="single"
            selected={selectedDay ?? undefined}
            onSelect={(d) => d && setSelectedDay(d)}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
          />
        </div>

        {/* RIGHT PANEL */}
        {selectedDay && (
          <div className="bg-slate-800 rounded-lg p-6 shadow border border-slate-700 w-[650px]">
            <h2 className="text-xl font-semibold mb-4">
              {selectedDay.toLocaleDateString()}
            </h2>

            {/* BLOCK DAY (auto-saves) */}
            <button
              onClick={toggleBlocked}
              className="
                w-full mb-4 px-3 py-2 rounded
                bg-red-600 hover:bg-red-700
              "
            >
              {blocked ? "Unblock Day" : "Block Day"}
            </button>

            <div className="flex gap-6">
              {/* ROSTER */}
              <div className="flex-1 space-y-3">
                <h3 className="text-lg font-semibold mb-2">Roster</h3>

                {Object.keys(roster).map((slotKey) => (
                  <select
                    key={slotKey}
                    className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white"
                    value={roster[slotKey] ?? ""}
                    onChange={(e) =>
                      setRoster((prev) => ({
                        ...prev,
                        [slotKey]: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                  >
                    <option value="">-- Empty --</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.role_name} – {member.name}
                      </option>
                    ))}
                  </select>
                ))}
              </div>

              {/* NOTES */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Notes</h3>

                <textarea
                  className="
                    w-full h-[425px] p-2 rounded bg-slate-700 border border-slate-600
                    text-white resize-none focus:outline-none
                    focus:border-[var(--accent)]
                  "
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* SAVE DAY (roster + notes only) */}
            <button
              onClick={saveDay}
              className="
                w-full mt-6 px-3 py-2 rounded font-semibold
                bg-[var(--accent)] hover:opacity-90
              "
            >
              Save Day
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
