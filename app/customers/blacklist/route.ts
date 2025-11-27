// app/customers/blacklist/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { customer_id, blacklisted, blacklist_reason, blacklist_start, blacklist_end } = body;

    if (!customer_id) {
      return NextResponse.json({ error: "Missing customer_id" }, { status: 400 });
    }

    const updates = {
      is_blacklisted: blacklisted,
      blacklist_reason,
      blacklist_start,
      blacklist_end,
    };

    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", customer_id)
      .select("*")
      .single();

    if (error) {
      console.error("Blacklist update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customer: data });
  } catch (err) {
    console.error("Blacklist route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
