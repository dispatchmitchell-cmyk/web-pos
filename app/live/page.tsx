// FILE: app/live/page.tsx
"use client";

import { useEffect, useState } from "react";

type ClockedInUser = {
  id: number;        // timesheet id
  staff_id: number;  // staff id
  name: string;
  clock_in: string;
};

export default function LivePage() {
  const [clockedIn, setClockedIn] = useState<ClockedInUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRow, setLoadingRow] = useState<number | null>(null);
  const [clockingAll, setClockingAll] = useState(false);

  const loadClockedIn = async () => {
    try {
      const res = await fetch("/api/live");
      const json = await res.json();
      setClockedIn(json.clocked_in || []);
    } catch (err) {
      console.error("Failed to load live data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClockedIn();
    const interval = setInterval(loadClockedIn, 10000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  // ----------------------------------------------------------
  // CLOCK OUT ONE STAFF MEMBER
  // ----------------------------------------------------------
  const clockOutSingle = async (timesheetId: number) => {
    setLoadingRow(timesheetId);
    try {
      const res = await fetch("/api/timesheet/clockout-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timesheet_id: timesheetId }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Clock-out failed");
      } else {
        await loadClockedIn();
      }
    } catch (err) {
      console.error("Clockout-single error:", err);
      alert("Clockout failed.");
    }
    setLoadingRow(null);
  };

  // ----------------------------------------------------------
  // CLOCK OUT ALL STAFF
  // ----------------------------------------------------------
  const clockOutAll = async () => {
    setClockingAll(true);

    try {
      const res = await fetch("/api/timesheet/clockout-all", {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Clock-out-all FAILED");
      } else {
        await loadClockedIn();
      }
    } catch (err) {
      console.error("Clock-out-all error:", err);
      alert("Clock-out-all failed.");
    }

    setClockingAll(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-24 px-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Live Staff</h1>

      <div className="flex justify-end mb-4">
        <button
          disabled={clockingAll}
          onClick={clockOutAll}
          className={`px-5 py-2 rounded font-semibold ${
            clockingAll
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-red-700 hover:bg-red-800 text-white"
          }`}
        >
          {clockingAll ? "Clocking Out All..." : "Clock Out All Staff"}
        </button>
      </div>

      <div className="bg-slate-900 p-6 rounded-xl shadow border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-emerald-300">
          Currently Clocked-In
        </h2>

        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : clockedIn.length === 0 ? (
          <p className="text-slate-500 italic">No staff currently clocked in.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-800 text-slate-300 border-b border-slate-700">
                <th className="p-3 text-left">Staff</th>
                <th className="p-3 text-left">Clocked In At</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {clockedIn.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >
                  <td className="p-3 text-lg">{u.name}</td>
                  <td className="p-3">
                    {new Date(u.clock_in).toLocaleString("en-AU", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="p-3">
                    <button
                      disabled={loadingRow === u.id}
                      onClick={() => clockOutSingle(u.id)}
                      className={`px-4 py-2 rounded text-sm font-semibold ${
                        loadingRow === u.id
                          ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                    >
                      {loadingRow === u.id ? "Clocking Out..." : "Clock Out"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
