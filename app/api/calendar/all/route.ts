// FILE: app/api/calendar/all/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

type CalendarDayRow = {
  date: string;
  blocked: boolean | null;
  notes: string | null;
};

export async function GET() {
  const { data, error } = await supabase
    .from("calendar_days")
    .select("date, blocked, notes");

  if (error) {
    console.error("calendar/all error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows: CalendarDayRow[] = data ?? [];

  return NextResponse.json(rows);
}
