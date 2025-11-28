// FILE: app/api/staff/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data: staff, error } = await supabase
    .from("staff")
    .select("id, name, role_id, role:role_id(name)")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Clean format (FIXED: role is an array)
  const formatted = staff.map((s) => ({
    id: s.id,
    name: s.name,
    role_id: s.role_id,
    role_name: s.role?.[0]?.name ?? "", // <-- FIXED HERE
  }));

  return NextResponse.json(formatted);
}
