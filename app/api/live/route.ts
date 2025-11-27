// app/api/live/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("timesheets")
    .select(
      `
      id,
      staff_id,
      clock_in,
      staff:staff_id (
        name
      )
    `
    )
    .is("clock_out", null)
    .eq("is_clocked_in", true);

  if (error) {
    console.error("Live fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  // ⭐ FIX — clean, safe mapping
  const mapped =
    data?.map((row: any) => ({
      id: row.id,
      staff_id: row.staff_id,
      name: row.staff?.name ?? "Unknown",
      clock_in: row.clock_in,
    })) ?? [];

  return NextResponse.json({ clocked_in: mapped });
}
