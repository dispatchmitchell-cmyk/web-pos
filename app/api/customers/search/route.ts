// app/api/customers/search/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    if (!q) {
      return NextResponse.json({ customers: [] });
    }

    // ----------------------------------------------------
    // Search customers (name, phone, affiliation, VIP)
    // ----------------------------------------------------
    const vipSearch = q === "vip" ? "true" : "false";

    const { data: basicRaw, error } = await supabase
      .from("customers")
      .select(`
        id,
        name,
        phone,
        affiliation,
        discount_id,
        is_blacklisted,
        blacklist_reason,
        blacklist_start,
        blacklist_end,
        vip
      `)
      .or(
        `name.ilike.%${q}%, phone.ilike.%${q}%, affiliation.ilike.%${q}%, vip.eq.${vipSearch}`
      )
      .order("name");

    if (error) {
      console.error("Customer search error:", error);
      return NextResponse.json({ customers: [] });
    }

    return NextResponse.json({ customers: basicRaw || [] });
  } catch (err) {
    console.error("Search route error:", err);
    return NextResponse.json({ customers: [] });
  }
}
