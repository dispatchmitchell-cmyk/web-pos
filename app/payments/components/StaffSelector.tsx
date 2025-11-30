//  app/payments/components/StaffSelector.tsx
"use client";

import React, { useEffect, useState } from "react";

type Staff = {
  id: number;
  name: string;
  role: string;
  total_pay: number;
};

export default function StaffSelector({
  session,
  selectedStaffId,
  onSelect,
}: {
  session: any;
  selectedStaffId: number | null;
  onSelect: (id: number) => void;
}) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const userRole = session?.role?.toLowerCase?.() || "";
  const userId =
    session?.id || session?.staff_id || session?.staff?.id || null;

  const isPrivileged = ["admin", "owner", "manager"].includes(userRole);

  // Load staff based on permissions
  const loadStaff = async () => {
    if (!session || !userId) return;

    setLoading(true);

    // Non-privileged users → can only select themselves
    if (!isPrivileged) {
      const self: Staff = {
        id: userId,
        name: session.name,
        role: session.role,
        total_pay: 0,
      };
      setStaffList([self]);
      onSelect(self.id);
      setLoading(false);
      return;
    }

    // Privileged → load ONLY unpaid staff
    try {
      console.log("Fetching /api/payments/unpaid-staff…");
      const res = await fetch("/api/payments/unpaid-staff");
      const json = await res.json();

      console.log("UNPAID STAFF RESPONSE:", json);

      const unpaid: Staff[] = (json.staff || [])
        .map((raw: any) => ({
          id: raw.id,
          name: raw.name,
          role: raw.role,
          total_pay: Number(raw.total_pay),
        }))
        .filter((s: Staff) => s.total_pay > 0); // 🔥 FIX: typed parameter

      console.log("Filtered unpaid:", unpaid);

      setStaffList(unpaid);

      // Auto-select first unpaid
      if (!selectedStaffId && unpaid.length > 0) {
        onSelect(unpaid[0].id);
      }
    } catch (err) {
      console.error("Failed to load unpaid staff:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadStaff();
  }, [session]);

  return (
    <div className="mb-6 bg-slate-900 border border-slate-700 p-4 rounded-xl shadow">
      <label className="block mb-2 text-slate-300 font-medium">
        Select Staff Member
      </label>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : staffList.length === 0 ? (
        <div className="text-slate-500 italic">
          No staff members currently owed money.
        </div>
      ) : (
        <select
          className="bg-slate-800 border border-slate-700 rounded p-3 w-full text-slate-100"
          value={selectedStaffId ?? ""}
          onChange={(e) => onSelect(Number(e.target.value))}
        >
          <option value="" disabled>
            Select staff…
          </option>

          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.role}) — ${s.total_pay.toFixed(2)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
