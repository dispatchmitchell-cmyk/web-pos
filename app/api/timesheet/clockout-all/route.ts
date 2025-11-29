// FILE: app/api/timesheet/clockout-all/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST() {
  try {
    // 1. Fetch all staff currently clocked in
    const { data: activeShifts, error: activeErr } = await supabase
      .from("timesheets")
      .select("*")
      .is("clock_out", null);

    if (activeErr) {
      console.error("Clockout-all fetch error:", activeErr);
      return NextResponse.json(
        { error: "Failed to fetch active shifts" },
        { status: 500 }
      );
    }

    if (!activeShifts || activeShifts.length === 0) {
      return NextResponse.json({ success: true, message: "Nobody clocked in" });
    }

    const now = new Date().toISOString();

    // 2. Build update payloads
    const updates = activeShifts.map((shift) => {
      const clockInTime = new Date(shift.clock_in).getTime();
      const clockOutTime = Date.now();
      const hoursWorked = (clockOutTime - clockInTime) / 1000 / 60 / 60;

      return {
        id: shift.id,
        clock_out: now,
        hours_worked: hoursWorked,
        is_clocked_in: false,
      };
    });

    // 3. Perform the batch updates
    for (const upd of updates) {
      const { error } = await supabase
        .from("timesheets")
        .update({
          clock_out: upd.clock_out,
          hours_worked: upd.hours_worked,
          is_clocked_in: false,
        })
        .eq("id", upd.id);

      if (error) {
        console.error("Clockout-all update error:", error);
      }
    }

    return NextResponse.json({
      success: true,
      count: updates.length,
    });
  } catch (err) {
    console.error("Clockout-all fatal:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
