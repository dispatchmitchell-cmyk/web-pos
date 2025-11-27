// app/settings/commission/page.tsx
"use client";

import React, { useEffect, useState } from "react";

interface CommissionRate {
  role: string;
  rate: number;
  hourly_rate: number;
}

export default function CommissionSettingsPage() {
  const [session, setSession] = useState<null | {
    role: string;
    permissions_level: number;
  }>(null);

  const [rates, setRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isManagerOrAbove =
    session?.permissions_level !== undefined &&
    session.permissions_level >= 800;

  const isAdminOrOwner =
    session?.role === "admin" || session?.role === "owner";

  // ---------------------------------------------------------
  // LOAD SESSION + COMMISSION + HOURLY RATES
  // ---------------------------------------------------------
  useEffect(() => {
    async function load() {
      const sRes = await fetch("/api/auth/session", { cache: "no-store" });
      const sJson = await sRes.json();
      setSession(sJson.staff || null);

      const rRes = await fetch("/api/settings", { cache: "no-store" });
      if (!rRes.ok) throw new Error("Settings fetch failed.");

      const data = await rRes.json();

      const merged: CommissionRate[] = data.commission_rates.map((cr: any) => {
        const hr = data.hourly_rates.find(
          (h: any) => h.role.toLowerCase() === cr.role.toLowerCase()
        );
        return {
          role: cr.role,
          rate: Number(cr.rate),
          hourly_rate: hr ? Number(hr.hourly_rate) : 0,
        };
      });

      setRates(merged);
      setLoading(false);
    }

    load();
  }, []);

  if (!loading && !isManagerOrAbove) {
    return (
      <div className="min-h-screen pt-24 px-8 text-red-400 text-xl">
        You do not have permission to view this page.
      </div>
    );
  }

  const canEdit = isAdminOrOwner;

  async function saveChanges() {
    if (!canEdit) return;

    setSaving(true);

    for (const entry of rates) {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: entry.role,
          rate: entry.rate,
          hourly_rate: entry.hourly_rate,
        }),
      });
    }

    setSaving(false);
    alert("Settings updated successfully!");
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-8 text-slate-300">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-8 text-slate-100">
      {/* PAGE TITLE — WHITE EXACTLY LIKE YOUR OTHER SETTINGS PAGES */}
      <h1 className="text-3xl font-bold mb-4 text-white">
        Commission Settings
      </h1>

      <p className="text-slate-400 mb-6">
        Commission is calculated on <strong>profit (price – cost_price)</strong>.<br />
        Hourly rates apply to all recorded work hours.
      </p>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <table className="w-full">
          <thead className="bg-slate-800 border-b border-slate-700 text-slate-300">
            <tr>
              <th className="py-3 px-2 text-left">Role</th>
              <th className="py-3 px-2 text-left">Commission %</th>
              <th className="py-3 px-2 text-left">Hourly Rate ($)</th>
            </tr>
          </thead>

          <tbody>
            {rates.map((r) => (
              <tr
                key={r.role}
                className="border-b border-slate-800 hover:bg-slate-800/70"
              >
                <td className="p-3 capitalize">{r.role.replace(/_/g, " ")}</td>

                {/* COMMISSION INPUT */}
                <td className="p-3">
                  <input
                    type="number"
                    disabled={!canEdit}
                    className={`bg-slate-800 px-3 py-2 rounded border border-slate-700 w-24 outline-none ${
                      !canEdit ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    value={r.rate}
                    onChange={(e) => {
                      const updated = rates.map((x) =>
                        x.role === r.role
                          ? { ...x, rate: Number(e.target.value) }
                          : x
                      );
                      setRates(updated);
                    }}
                  />
                </td>

                {/* HOURLY INPUT */}
                <td className="p-3">
                  <input
                    type="number"
                    disabled={!canEdit}
                    className={`bg-slate-800 px-3 py-2 rounded border border-slate-700 w-28 outline-none ${
                      !canEdit ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    value={r.hourly_rate}
                    onChange={(e) => {
                      const updated = rates.map((x) =>
                        x.role === r.role
                          ? { ...x, hourly_rate: Number(e.target.value) }
                          : x
                      );
                      setRates(updated);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {canEdit && (
          <button
            onClick={saveChanges}
            disabled={saving}
            className="
              mt-6 px-6 py-3 rounded font-semibold
              bg-[color:var(--accent)]
              hover:bg-[color:var(--accent-hover)]
              disabled:opacity-50
            "
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
    </div>
  );
}
