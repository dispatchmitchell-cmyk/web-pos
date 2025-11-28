// FILE: app/api/calendar/day/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "Missing ?date=" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("calendar_days")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || null);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { date, blocked, notes, roster } = body;

  if (!date) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("calendar_days")
    .upsert(
      {
        date,
        blocked,
        notes,
        roster,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "date" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
