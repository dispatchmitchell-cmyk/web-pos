// app/pos/components/POSCustomerStatus.tsx
"use client";

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  discount_id: number | null;
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  blacklist_start: string | null;
  blacklist_end: string | null;
};

type Discount = {
  id: number;
  name: string;
  percent: number;
} | null;

export default function POSCustomerStatus({
  customer,
  discount,
  isBlacklisted,
}: {
  customer: Customer | null;
  discount: Discount;
  isBlacklisted: boolean;
}) {
  return (
    <div className="mb-4 p-3 rounded-lg bg-slate-800 text-slate-100 border border-slate-700">
      <h2 className="text-sm font-semibold text-slate-300 mb-1">Customer</h2>

      {!customer && <p className="text-slate-400 text-sm">No customer selected.</p>}

      {customer && (
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-slate-50">{customer.name}</p>
          {customer.phone && <p className="text-slate-300 text-xs">📞 {customer.phone}</p>}
          {customer.email && <p className="text-slate-300 text-xs">✉️ {customer.email}</p>}
        </div>
      )}

      {discount && <p className="text-amber-400">Discount: {discount.percent}% OFF</p>}

      {isBlacklisted && (
        <p className="mt-2 text-red-400 font-bold">⚠️ This customer is currently blacklisted</p>
      )}
    </div>
  );
}
