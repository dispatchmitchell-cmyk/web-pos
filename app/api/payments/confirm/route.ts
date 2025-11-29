// app/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session?.staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requesterRole = session.staff.role.toLowerCase();
    if (!["admin", "owner", "manager"].includes(requesterRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const {
      staff_id,
      period_start,
      period_end,

      hours,
      hourly_rate,
      hourly_pay,

      commission_rate,
      commission_profit,
      commission_value,

      bonus,             // ✅ NEW FIELD
      total_pay
    } = body;

    const required = [
      staff_id,
      period_start,
      period_end,
      hours,
      hourly_rate,
      hourly_pay,
      commission_rate,
      commission_profit,
      commission_value,
      total_pay
    ];

    if (required.some(v => v === undefined || v === null)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const insertPayload = {
      staff_id,
      paid_by: session.staff.id,
      period_start,
      period_end,
      hours_worked: hours,
      hourly_pay,
      commission: commission_value,
      bonus: bonus ?? 0,           // ✅ INSERT BONUS
      total_paid: total_pay + (bonus ?? 0)
    };

    const { data, error } = await supabase
      .from("payments")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error("Payment insert error:", error);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, payment: data });

  } catch (err) {
    console.error("Payment confirm fatal error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
