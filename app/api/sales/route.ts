import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth";

// Server-side Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.staff) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();

    const {
      customer_id,
      original_total,
      final_total,
      discount_id,
      payment_method,
      cart,
    } = body;

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    let tab_id: number | null = null;

    // --------------------------------------------------------------------
    // TAB PAYMENT DETECTION: format is "tab:<id>"
    // --------------------------------------------------------------------
    if (payment_method.startsWith("tab:")) {
      tab_id = Number(payment_method.split(":")[1]);

      if (isNaN(tab_id)) {
        return NextResponse.json(
          { error: "Invalid tab selected" },
          { status: 400 }
        );
      }

      // Fetch the tab
      const { data: tab, error: tabErr } = await supabase
        .from("tabs")
        .select("*")
        .eq("id", tab_id)
        .eq("active", true)
        .maybeSingle();

      if (tabErr || !tab) {
        return NextResponse.json(
          { error: "Tab not found or inactive" },
          { status: 400 }
        );
      }

      if (Number(tab.amount) < Number(final_total)) {
        return NextResponse.json(
          { error: "Insufficient tab balance" },
          { status: 400 }
        );
      }

      // Deduct from tab BEFORE recording the sale
      const { error: updateErr } = await supabase
        .from("tabs")
        .update({
          amount: Number(tab.amount) - Number(final_total),
        })
        .eq("id", tab_id);

      if (updateErr) {
        console.error("TAB UPDATE ERROR:", updateErr);
        return NextResponse.json(
          { error: "Failed to update tab balance" },
          { status: 500 }
        );
      }
    }

    // --------------------------------------------------------------------
    // INSERT SALE
    // --------------------------------------------------------------------
    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .insert({
        staff_id: session.staff.id,
        customer_id: customer_id || null,
        original_total,
        final_total,
        discount_id: discount_id || null,
        payment_method: payment_method, // stores "tab:2" or "Cash"
      })
      .select("*")
      .single();

    if (saleErr) {
      console.error("SALE INSERT ERROR:", saleErr);
      return NextResponse.json({ error: saleErr.message }, { status: 500 });
    }

    // --------------------------------------------------------------------
    // INSERT SALE ITEMS
    // --------------------------------------------------------------------
    const saleItems = cart.map((item: any) => ({
      sale_id: sale.id,
      item_id: item.id,
      quantity: item.quantity,
      price_each: item.price,
      subtotal: item.price * item.quantity,
    }));

    const { error: saleItemsErr } = await supabase
      .from("sale_items")
      .insert(saleItems);

    if (saleItemsErr) {
      console.error("SALE ITEMS ERROR:", saleItemsErr);
      return NextResponse.json({ error: saleItemsErr.message }, { status: 500 });
    }

    // --------------------------------------------------------------------
    // UPDATE STOCK
    // --------------------------------------------------------------------
    for (const item of cart) {
      await supabase
        .from("items")
        .update({
          stock: item.stock !== undefined ? item.stock - item.quantity : undefined,
        })
        .eq("id", item.id);
    }

    return NextResponse.json({ success: true, sale_id: sale.id });
  } catch (err) {
    console.error("SALE API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
