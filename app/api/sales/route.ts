// FILE: app/api/sales/route.ts
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

    const {
      staff_id,
      customer_id,
      original_total,
      final_total,
      discount_id,
      payment_method,
      cart,
    } = body;

    if (!staff_id || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: "Invalid sale request." },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------------------
    // 0. TAB PAYMENT HANDLING ("tab:ID" format)
    // ------------------------------------------------------------------------------
    let usedTabId: number | null = null;

    if (
      payment_method &&
      payment_method.startsWith("tab:")
    ) {
      // extract numeric ID → "tab:6" → 6
      const tabId = Number(payment_method.replace("tab:", "").trim());

      if (isNaN(tabId)) {
        return NextResponse.json(
          { error: "Invalid tab format." },
          { status: 400 }
        );
      }

      const { data: tab, error: tabError } = await supabase
        .from("tabs")
        .select("*")
        .eq("id", tabId)
        .eq("active", true)
        .maybeSingle();

      if (tabError) {
        return NextResponse.json(
          { error: "Tab lookup failure: " + tabError.message },
          { status: 500 }
        );
      }

      if (!tab) {
        return NextResponse.json(
          { error: `Tab not found: tab:${tabId}` },
          { status: 400 }
        );
      }

      if (tab.amount < final_total) {
        return NextResponse.json(
          { error: "Insufficient funds on tab." },
          { status: 400 }
        );
      }

      // Perform deduction
      const newAmount = tab.amount - final_total;

      const { error: updateError } = await supabase
        .from("tabs")
        .update({ amount: newAmount })
        .eq("id", tabId);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update tab balance: " + updateError.message },
          { status: 500 }
        );
      }

      usedTabId = tabId;
    }

    // ------------------------------------------------------------------------------
    // 1. CREATE SALE
    // ------------------------------------------------------------------------------
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          staff_id,
          customer_id: customer_id || null,
          original_total,
          final_total,
          discount_id: discount_id || null,
          payment_method, // still store original field (Cash/Card/tab:X)
          tab_id: usedTabId,
          voided: false,
        },
      ])
      .select()
      .single();

    if (saleError || !sale) {
      return NextResponse.json(
        { error: saleError?.message || "Failed to create sale." },
        { status: 500 }
      );
    }

    const saleId = sale.id;

    // ------------------------------------------------------------------------------
    // 2. INSERT SALE ITEMS (stock updated via trigger)
    // ------------------------------------------------------------------------------
    const saleItemsPayload = cart.map((item: any) => ({
      sale_id: saleId,
      item_id: item.id,
      quantity: item.quantity,
      price_each: item.price,
      subtotal: item.price * item.quantity,
      voided: false,
    }));

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItemsPayload);

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message || "Failed to add sale items." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------------------------
    // SUCCESS
    // ------------------------------------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        sale_id: saleId,
        sale,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Sales API Fatal Error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
