// app/api/settings/business/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

// -------------------------------------------------
// GET BUSINESS SETTINGS
// -------------------------------------------------
export async function GET() {
  const { data, error } = await supabase
    .from("business_settings")
    .select("*")
    .single();

  if (error) {
    console.error("GET business settings error:", error);
    return NextResponse.json(
      { error: "Failed to load business settings" },
      { status: 500 }
    );
  }

  return NextResponse.json({ settings: data });
}

// -------------------------------------------------
// UPDATE BUSINESS SETTINGS
// -------------------------------------------------
export async function PUT(req: Request) {
  const body = await req.json();

  const { business_name, business_logo_url, theme_color, logo_width, logo_height } =
    body;

  const { data, error } = await supabase
    .from("business_settings")
    .update({
      business_name,
      business_logo_url,
      theme_color,
      logo_width,
      logo_height,
    })
    .eq("id", 1) // always update row 1
    .select()
    .single();

  if (error) {
    console.error("PUT business settings error:", error);
    return NextResponse.json(
      { error: "Failed to update business settings" },
      { status: 500 }
    );
  }

  return NextResponse.json({ settings: data });
}
