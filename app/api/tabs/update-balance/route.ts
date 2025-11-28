// FILE: app/api/tabs/update-balance/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function PUT(req: Request) {
  const body = await req.json();

  // Accept both naming styles from frontend
  const tabId = body.tab_id ?? body.tabId;
  const newAmount = body.new_amount ?? body.newAmount;

  if (!tabId || newAmount === undefined) {
    return NextResponse.json(
      { error: "Missing tab_id or new_amount" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("tabs")
    .update({ amount: newAmount })
    .eq("id", tabId);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
