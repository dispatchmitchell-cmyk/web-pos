// app/api/payments/unpaid-staff/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

/* ---------------------------------------------------------
   HELPER: Fetch staff list
--------------------------------------------------------- */
async function loadAllStaff() {
  const { data } = await supabase
    .from("staff")
    .select("id, name, role_id");

  return data || [];
}

/* ---------------------------------------------------------
   HELPER: Load role hourly rate
--------------------------------------------------------- */
async function loadRole(role_id: number) {
  const { data } = await supabase
    .from("roles")
    .select("name, hourly_rate")
    .eq("id", role_id)
    .single();

  return {
    role_name: data?.name || "staff",
    hourly_rate: Number(data?.hourly_rate ?? 0)
  };
}

/* ---------------------------------------------------------
   PAY PERIOD
--------------------------------------------------------- */
async function getPayPeriod(staff_id: number) {
  const { data: last } = await supabase
    .from("payments")
    .select("period_end")
    .eq("staff_id", staff_id)
    .order("period_end", { ascending: false })
    .limit(1)
    .single();

  const now = new Date();

  const period_start = last?.period_end
    ? new Date(last.period_end)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  return { period_start, period_end: now };
}

/* ---------------------------------------------------------
   HOURS WORKED
--------------------------------------------------------- */
async function getHours(staff_id: number, start: Date, end: Date) {
  const { data } = await supabase
    .from("timesheets")
    .select("hours_worked")
    .eq("staff_id", staff_id)
    .gte("clock_in", start.toISOString())
    .lte("clock_in", end.toISOString());

  return data?.reduce((s, r) => s + Number(r.hours_worked || 0), 0) ?? 0;
}

/* ---------------------------------------------------------
   COMMISSION
--------------------------------------------------------- */
async function getCommission(staff_id: number, role_name: string, start: Date, end: Date) {
  const { data: rateRow } = await supabase
    .from("commission_rates")
    .select("rate")
    .eq("role", role_name.toLowerCase())
    .single();

  const rate = Number(rateRow?.rate ?? 0);

  const { data: sales } = await supabase
    .from("sales")
    .select("id, final_total, original_total, refunded")
    .eq("staff_id", staff_id)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (!sales || sales.length === 0)
    return { rate, profit: 0, value: 0 };

  let totalProfit = 0;

  for (const sale of sales) {
    if (sale.refunded) continue;

    const saleId = sale.id;
    const original = Number(sale.original_total || 0);
    const final = Number(sale.final_total || 0);
    const discountLoss = Math.max(0, original - final);

    const { data: items } = await supabase
      .from("sale_items")
      .select("item_id, quantity, price_each, subtotal")
      .eq("sale_id", saleId);

    if (!items?.length) continue;

    const sumSubtotals = items.reduce((s, i) => s + Number(i.subtotal || 0), 0);

    const itemIds = items.map((i) => i.item_id);
    const { data: products } = await supabase
      .from("items")
      .select("id, cost_price")
      .in("id", itemIds);

    const costMap: Record<number, number> = {};
    products?.forEach((p) => {
      costMap[p.id] = Number(p.cost_price || 0);
    });

    for (const item of items) {
      const qty = Number(item.quantity || 0);
      const priceEach = Number(item.price_each || 0);
      const subtotal = Number(item.subtotal || 0);
      const cost = costMap[item.item_id] ?? 0;

      const baseProfit = (priceEach - cost) * qty;
      const discountShare = (subtotal / sumSubtotals) * discountLoss;

      totalProfit += Math.max(0, baseProfit - discountShare);
    }
  }

  const commissionValue = totalProfit * (rate / 100);

  return { rate, profit: totalProfit, value: commissionValue };
}

/* ---------------------------------------------------------
   MAIN HANDLER – Return staff who are owed money
--------------------------------------------------------- */
export async function GET() {
  const session = await getSession();

  if (!session?.staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.staff.role.toLowerCase();
  if (!["admin", "owner", "manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staff = await loadAllStaff();
  const unpaid: any[] = [];

  for (const s of staff) {
    const { role_name, hourly_rate } = await loadRole(s.role_id);
    const { period_start, period_end } = await getPayPeriod(s.id);

    const hours = await getHours(s.id, period_start, period_end);
    const hourly_pay = hours * hourly_rate;

    const commission = await getCommission(s.id, role_name, period_start, period_end);

    const total_pay = Math.max(0, hourly_pay + commission.value);

    if (total_pay > 0) {
      unpaid.push({
        id: s.id,
        name: s.name,
        role: role_name,
        total_pay
      });
    }
  }

  return NextResponse.json({ staff: unpaid });
}
