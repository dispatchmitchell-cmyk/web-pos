// app/payments/components/PaymentSummaryCard.tsx
"use client";

import React from "react";

interface Props {
  summary: {
    staff_id: number;
    period: { start: string; end: string };
    hours: { total: number; hourly_rate: number; hourly_pay: number };
    commission: { rate: number; profit: number; value: number };
    total_pay: number;
    last_paid?: string | null;
    bonus?: number;                        // ⚠ Only for display
  };
}

export default function PaymentSummaryCard({ summary }: Props) {
  const { period, hours, commission, total_pay, bonus, last_paid } = summary;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow">

      <h2 className="text-2xl font-bold mb-4">Payment Summary</h2>

      {/* PAY PERIOD */}
      <div className="mb-6">
        <p className="text-slate-400 uppercase text-xs">Pay Period</p>
        <p className="font-semibold">
          {formatDate(period.start)} → {formatDate(period.end)}
        </p>
      </div>

      <div className="border-t border-slate-700 my-4"></div>

      {/* HOURS */}
      <div className="mb-6">
        <p className="text-slate-400 uppercase text-xs mb-2">Hours Worked</p>
        <div className="flex justify-between">
          <span>Total Hours:</span>
          <span>{hours.total.toFixed(2)}h</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Hourly Rate:</span>
          <span>${hours.hourly_rate}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Hourly Pay:</span>
          <span>${hours.hourly_pay}</span>
        </div>
      </div>

      <div className="border-t my-4 border-slate-700"></div>

      {/* COMMISSION */}
      <div className="mb-6">
        <p className="text-slate-400 uppercase text-xs mb-2">Commission</p>

        <div className="flex justify-between">
          <span>Commission Rate:</span>
          <span>{commission.rate}%</span>
        </div>

        <div className="flex justify-between mt-1">
          <span>Profit Generated:</span>
          <span>${commission.profit.toFixed(2)}</span>
        </div>

        <div className="flex justify-between mt-1">
          <span>Commission Earned:</span>
          <span>${commission.value.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t my-4 border-slate-700"></div>

      {/* BONUS */}
      {bonus !== undefined && (
        <>
          <div className="mb-6">
            <p className="text-slate-400 uppercase text-xs mb-2">Bonus</p>
            <p className="text-xl font-bold text-fuchsia-400">
              ${bonus.toFixed(2)}
            </p>
          </div>

          <div className="border-t my-4 border-slate-700"></div>
        </>
      )}

      {/* TOTAL */}
      <div className="mb-4">
        <p className="text-slate-400 uppercase text-xs mb-2">Total Pay</p>
        <p className="text-3xl font-extrabold text-emerald-400">
          ${total_pay.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
