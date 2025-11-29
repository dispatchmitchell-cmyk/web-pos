// app/payments/components/ConfirmPaymentModal.tsx
"use client";

import React, { useState } from "react";

interface PaySummary {
  staff_id: number;
  period: { start: string | Date; end: string | Date };
  hours: { total: number; hourly_rate: number; hourly_pay: number };
  commission: { rate: number; profit: number; value: number };
  total_pay: number;
}

export default function ConfirmPaymentModal({
  open,
  onClose,
  summary,
  staffName,
  onPaid,
}: {
  open: boolean;
  onClose: () => void;
  summary: PaySummary | null;
  staffName: string;
  onPaid: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [bonus, setBonus] = useState<number>(0);

  if (!open || !summary) return null;

  const s = summary;

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });

  async function confirmPayment() {
    setLoading(true);

    const body = {
      staff_id: s.staff_id,
      period_start: s.period.start,
      period_end: s.period.end,

      hours: s.hours.total,
      hourly_rate: s.hours.hourly_rate,
      hourly_pay: s.hours.hourly_pay,

      commission_rate: s.commission.rate,
      commission_profit: s.commission.profit,
      commission_value: s.commission.value,

      bonus,                                         // ✅ SEND BONUS
      total_pay: s.total_pay + bonus                 // ✅ ADD TO TOTAL
    };

    const res = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      onPaid();
      onClose();
    } else {
      alert("Payment failed.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 p-6 border border-slate-700 rounded-xl w-[420px] text-slate-100 shadow-xl">

        <h2 className="text-2xl font-bold mb-4 text-fuchsia-400">Confirm Payment</h2>

        <p className="mb-4 text-slate-300">
          You are about to pay <strong>{staffName}</strong>.
        </p>

        {/* BONUS INPUT */}
        <div className="bg-slate-800 p-4 mb-4 rounded border border-slate-700">
          <label className="block text-sm font-semibold mb-1 text-fuchsia-300">
            Add Bonus (Optional)
          </label>
          <input
            type="number"
            value={bonus}
            min={0}
            onChange={(e) => setBonus(Number(e.target.value))}
            className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
            placeholder="0"
          />
        </div>

        {/* TOTAL INCLUDING BONUS */}
        <div className="flex justify-between p-4 border border-slate-700 rounded mb-6 bg-slate-900">
          <span className="font-bold text-lg">NEW TOTAL</span>
          <span className="text-2xl font-extrabold text-emerald-400">
            ${(s.total_pay + bonus).toLocaleString()}
          </span>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2 bg-slate-700 rounded" onClick={onClose} disabled={loading}>
            Cancel
          </button>

          <button
            onClick={confirmPayment}
            disabled={loading}
            className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 rounded text-white"
          >
            {loading ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
