// app/api/settings/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * ---------------------------------------------------
 * GET SETTINGS
 * Returns:
 *  - commission_rates from table: commission_rates
 *  - hourly_rates     from table: roles (column hourly_rate)
 * ---------------------------------------------------
 */
export async function GET() {
  const db = supabase();

  // Load commission rates
  const { data: commission, error: cErr } = await db
    .from("commission_rates")
    .select("role, rate")
    .order("role");

  if (cErr)
    return NextResponse.json({ error: cErr.message }, { status: 500 });

  // Load hourly rates from roles table
  const { data: roles, error: rErr } = await db
    .from("roles")
    .select("name, hourly_rate")
    .order("permissions_level");

  if (rErr)
    return NextResponse.json({ error: rErr.message }, { status: 500 });

  // Transform into expected frontend shape
  const hourly = roles.map((r) => ({
    role: r.name,
    hourly_rate: Number(r.hourly_rate ?? 0),
  }));

  return NextResponse.json({
    commission_rates: commission,
    hourly_rates: hourly,
  });
}

/**
 * ---------------------------------------------------
 * UPDATE SETTINGS
 * Called once per role from commission UI.
 * Updates:
 *  - commission_rates.rate
 *  - roles.hourly_rate
 * ---------------------------------------------------
 */
export async function PUT(req: Request) {
  const db = supabase();
  const body = await req.json();

  const { role, rate, hourly_rate } = body;

  if (!role)
    return NextResponse.json(
      { error: "Role is required" },
      { status: 400 }
    );

  // 1. Update commission rate
  const { error: cErr } = await db
    .from("commission_rates")
    .update({ rate })
    .eq("role", role);

  if (cErr)
    return NextResponse.json({ error: cErr.message }, { status: 500 });

  // 2. Update hourly rate
  const { error: hErr } = await db
    .from("roles")
    .update({ hourly_rate })
    .eq("name", role);

  if (hErr)
    return NextResponse.json({ error: hErr.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
