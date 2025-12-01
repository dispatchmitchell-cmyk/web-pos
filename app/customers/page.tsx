// app/customers/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import EditCustomerModal from "./components/EditCustomerModal";
import BlacklistModal from "./components/BlacklistModal";

type Customer = {
  id: number;
  name: string;
  phone: string;
  affiliation: string | null;
  discount_id: number | null;
  is_blacklisted: boolean;
  blacklist_start: string | null;
  blacklist_end: string | null;
  blacklist_reason: string | null;
  vip: boolean;
};

type Discount = {
  id: number;
  name: string;
  percent: number;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  const [discounts, setDiscounts] = useState<Discount[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [blacklistModal, setBlacklistModal] = useState(false);
  const [blacklistCustomer, setBlacklistCustomer] =
    useState<Customer | null>(null);

  // LOAD CUSTOMERS
  const loadCustomers = async () => {
    const res = await fetch("/api/customers", { cache: "no-store" });
    const json = await res.json();
    setCustomers(json.customers || []);
  };

  // LOAD DISCOUNTS
  const loadDiscounts = async () => {
    const res = await fetch("/api/discounts", { cache: "no-store" });
    const json = await res.json();
    setDiscounts(json.discounts || []);
  };

  useEffect(() => {
    loadDiscounts();
    loadCustomers();
  }, []);

  // FILTER
  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;

    const t = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(t) ||
      (c.phone || "").includes(search) ||
      (c.affiliation || "").toLowerCase().includes(t) ||
      (c.vip ? "vip" : "").includes(t)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pt-24 px-8">
      <div className="flex justify-between mb-6">
        <h2 className="text-3xl font-bold">Customers</h2>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowModal(true);
          }}
          className="
            px-4 py-2 rounded-lg
            bg-[color:var(--accent)]
            hover:bg-[color:var(--accent-hover)]
          "
        >
          + Add Customer
        </button>
      </div>

      <input
        type="text"
        className="w-full mb-6 p-3 bg-slate-900 border border-slate-700 rounded"
        placeholder="Search by name, phone, affiliation, or VIP"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-slate-900 border border-slate-700 rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Affiliation</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-slate-800">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{c.affiliation || "-"}</td>

                <td className="p-3 space-x-2">
                  {c.vip && (
                    <span className="text-yellow-400 font-bold">VIP</span>
                  )}
                  {c.is_blacklisted && (
                    <span className="text-red-400 font-bold">
                      BLACKLISTED
                    </span>
                  )}
                  {!c.vip && !c.is_blacklisted && "-"}
                </td>

                <td className="p-3 text-right">
                  <button
                    onClick={() => {
                      setEditingCustomer(c);
                      setShowModal(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 mr-4"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      setBlacklistCustomer(c);
                      setBlacklistModal(true);
                    }}
                    className="text-red-400 hover:text-red-300 mr-4"
                  >
                    Blacklist
                  </button>

                  <button
                    onClick={async () => {
                      if (!confirm("Delete this customer?")) return;

                      await fetch(`/api/customers?id=${c.id}`, {
                        method: "DELETE",
                      });
                      loadCustomers();
                    }}
                    className="text-red-500 hover:text-red-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-slate-500 italic"
                >
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setShowModal(false)}
          onSaved={loadCustomers}
        />
      )}

      {blacklistModal && blacklistCustomer && (
        <BlacklistModal
          customer={blacklistCustomer}
          onClose={() => setBlacklistModal(false)}
          onSaved={loadCustomers}
        />
      )}
    </div>
  );
}
