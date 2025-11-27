// app/staff/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StaffTable from "./components/StaffTable";
import EditStaffModal from "./components/EditStaffModal";
import type { StaffRecord } from "@/lib/types";

export default function StaffPage() {
  const router = useRouter();

  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [editing, setEditing] = useState<StaffRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // AUTH GUARD
  useEffect(() => {
    async function guard() {
      try {
        const res = await fetch(`/api/auth/session`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const session = await res.json();
        if (!session.staff) router.push("/login");
      } catch {
        router.push("/login");
      }
    }

    guard();
  }, [router]);

  // LOAD STAFF
  async function loadStaff() {
    try {
      setLoading(true);
      const res = await fetch(`/api/staff`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();
      if (res.ok) setStaff(json.staff ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 pt-24 px-8">

      {/* HEADER — same style as all other pages */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Staff Management</h2>

        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] px-4 py-2 rounded-lg"
        >
          + Add Staff
        </button>
      </div>

      {/* TABLE WRAPPER — identical to other pages */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
        {loading ? (
          <p className="p-4 text-slate-400">Loading staff...</p>
        ) : (
          <StaffTable
            staff={staff}
            onEdit={(member) => {
              setEditing(member);
              setShowModal(true);
            }}
            onRefresh={loadStaff}
          />
        )}
      </div>

      {showModal && (
        <EditStaffModal
          staffMember={editing}
          onClose={() => setShowModal(false)}
          onSaved={loadStaff}
        />
      )}
    </div>
  );
}
