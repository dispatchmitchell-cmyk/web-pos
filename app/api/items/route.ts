// FILE: app/api/items/route.ts

/**
 * ITEMS API — strong typing, safe inputs, cost_price support
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";

// Server-side Supabase client
function supabaseServer() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Roles allowed to create/update/delete items
const PRIVILEGED_ROLES = ["owner", "admin", "manager"];

/**
 * Ensures caller has a privileged staff role
 */
async function requirePrivilegedRole() {
  const session = await getSession();

  if (!session?.staff) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }

  const role = session.staff.role?.toLowerCase() ?? "staff";

  if (!PRIVILEGED_ROLES.includes(role)) {
    return { ok: false, status: 403, message: "Insufficient permissions" };
  }

  return { ok: true, role };
}

/* -------------------------------------------------------------
   GET — Public items (includes cost_price for UI)
------------------------------------------------------------- */
export async function GET() {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("items")
    .select("id, name, price, cost_price, stock, category")
    .order("name");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data });
}

/* -------------------------------------------------------------
   POST — Create item (privileged only)
------------------------------------------------------------- */
export async function POST(req: Request) {
  const guard = await requirePrivilegedRole();
  if (!guard.ok)
    return NextResponse.json({ error: guard.message }, { status: guard.status });

  const supabase = supabaseServer();
  const body = await req.json();

  const newItem = {
    name: String(body.name ?? ""),
    price: Number(body.price ?? 0),
    stock: Number(body.stock ?? 0),
    category: String(body.category ?? ""),
    cost_price:
      body.cost_price !== undefined && body.cost_price !== null
        ? Number(body.cost_price)
        : null,
  };

  const { data, error } = await supabase
    .from("items")
    .insert([newItem])
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: data });
}

/* -------------------------------------------------------------
   PUT — Update item (privileged only)
------------------------------------------------------------- */
export async function PUT(req: Request) {
  const guard = await requirePrivilegedRole();
  if (!guard.ok)
    return NextResponse.json({ error: guard.message }, { status: guard.status });

  const supabase = supabaseServer();
  const body = await req.json();

  if (!body.id)
    return NextResponse.json({ error: "Missing item ID" }, { status: 400 });

  const updates: Record<string, any> = {};

  if (body.name !== undefined) updates.name = String(body.name);
  if (body.price !== undefined) updates.price = Number(body.price);
  if (body.stock !== undefined) updates.stock = Number(body.stock);
  if (body.category !== undefined) updates.category = String(body.category);

  // cost_price (privileged)
  updates.cost_price =
    body.cost_price !== undefined && body.cost_price !== null
      ? Number(body.cost_price)
      : null;

  const { data, error } = await supabase
    .from("items")
    .update(updates)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: data });
}

/* -------------------------------------------------------------
   DELETE — Remove item (privileged only)
------------------------------------------------------------- */
export async function DELETE(req: Request) {
  const guard = await requirePrivilegedRole();
  if (!guard.ok)
    return NextResponse.json(
      { error: guard.message },
      { status: guard.status }
    );

  const supabase = supabaseServer();
  const { id } = await req.json();

  if (!id)
    return NextResponse.json({ error: "Missing item ID" }, { status: 400 });

  const { error } = await supabase.from("items").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
