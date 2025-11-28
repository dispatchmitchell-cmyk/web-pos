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

    // ----------------------------------------
    // 1. CREATE SALE
    // ----------------------------------------
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          staff_id,
          customer_id: customer_id || null,
          original_total,
          final_total,
          discount_id: discount_id || null,
          payment_method,
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

    // ----------------------------------------
    // 2. INSERT SALE ITEMS
    // (STOCK WILL BE UPDATED BY DB TRIGGER)
    // ----------------------------------------
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

    // ----------------------------------------
    // SUCCESS
    // ----------------------------------------
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
