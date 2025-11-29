// FILE: app/api/timesheet/clockout-single/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { timesheet_id } = await req.json();

    if (!timesheet_id) {
      return NextResponse.json(
        { error: "Missing timesheet_id" },
        { status: 400 }
      );
    }

    // Load shift
    const { data: shift, error: shiftErr } = await supabase
      .from("timesheets")
      .select("*")
      .eq("id", timesheet_id)
      .maybeSingle();

    if (shiftErr || !shift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const start = new Date(shift.clock_in).getTime();
    const end = Date.now();
    const hours = (end - start) / 1000 / 60 / 60;

    const { error: updateErr } = await supabase
      .from("timesheets")
      .update({
        clock_out: now,
        hours_worked: hours,
        is_clocked_in: false,
      })
      .eq("id", timesheet_id);

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: timesheet_id,
      clock_out: now,
      hours_worked: hours,
    });
  } catch (err) {
    console.error("Clockout-single fatal", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
