// app/api/settings/upload-logo/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = `logo_${Date.now()}_${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from("branding")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadErr) {
      console.error(uploadErr);
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    // Create public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("branding").getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
