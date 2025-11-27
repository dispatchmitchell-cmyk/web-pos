// app/api/tabs/update-balance/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function PUT(req: Request) {
  const { tabId, newAmount } = await req.json();

  const { error } = await supabase
    .from("tabs")
    .update({ amount: newAmount })
    .eq("id", tabId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
