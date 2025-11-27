"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { StaffRecord } from "@/lib/types";

interface StaffTableProps {
  staff: StaffRecord[];
  onEdit: (member: StaffRecord) => void;
  onRefresh: () => Promise<void>;
}

export default function StaffTable({
  staff,
  onEdit,
  onRefresh,
}: StaffTableProps) {
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    role: string;
    permissions: number;
  } | null>(null);

  // Load session
  useEffect(() => {
    async function loadSession() {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const json = await res.json();
      if (!json.staff) return;

      setCurrentUser({
        id: json.staff.id,
        role: json.staff.role.toLowerCase(),
        permissions: json.staff.permissions_level ?? 0,
      });
    }
    loadSession();
  }, []);

  // Permission logic
  function canModify(member: StaffRecord): boolean {
    if (!currentUser) return false;
    if (currentUser.id === member.id) return true;
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "owner" && member.role !== "admin") return true;
    return false;
  }

  function canDelete(member: StaffRecord): boolean {
    if (!currentUser) return false;
    if (currentUser.id === member.id) return false;
    if (currentUser.role === "admin") return true;
    if (currentUser.role === "owner" && member.role !== "admin") return true;
    return false;
  }

  // Sort staff
  const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => {
      if (a.permissions_level !== b.permissions_level) {
        return b.permissions_level - a.permissions_level;
      }
      return a.name.localeCompare(b.name);
    });
  }, [staff]);

  // Fixed delete handler
  const handleDelete = async (member: StaffRecord) => {
    if (!confirm(`Delete ${member.name}?`)) return;

    const res = await fetch(`/api/staff?id=${member.id}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Failed to delete staff.");
      return;
    }

    await onRefresh();
  };

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-800 border-b border-slate-700">
        <tr>
          <th className="p-3 text-left">Name</th>
          <th className="p-3 text-left">Username</th>
          <th className="p-3 text-left">Role</th>
          <th className="p-3 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {sortedStaff.length === 0 ? (
          <tr>
            <td colSpan={4} className="p-6 text-center text-slate-500 italic">
              No staff found.
            </td>
          </tr>
        ) : (
          sortedStaff.map((member) => {
            const editable = canModify(member);
            const deletable = canDelete(member);

            return (
              <tr
                key={member.id}
                className="border-b border-slate-800 hover:bg-slate-800"
              >
                <td className="p-3">{member.name}</td>
                <td className="p-3">{member.username}</td>
                <td className="p-3 capitalize">{member.role}</td>

                <td className="p-3 text-right space-x-4">
                  {/* EDIT */}
                  <button
                    disabled={!editable}
                    onClick={() => editable && onEdit(member)}
                    className={`text-amber-400 hover:text-amber-300 ${
                      !editable ? "opacity-40 cursor-not-allowed" : ""
                    }`}
                  >
                    Edit
                  </button>

                  {/* DELETE */}
                  {deletable && (
                    <button
                      onClick={() => handleDelete(member)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
