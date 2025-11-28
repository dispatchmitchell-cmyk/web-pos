// app/pos/hooks/usePOS.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type Item = {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string | null;
  category: string;
};

export type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  discount_id: number | null;
  is_blacklisted: boolean;
  blacklist_reason: string | null;
  blacklist_start: string | null;
  blacklist_end: string | null;
};

export type Discount = {
  id: number;
  name: string;
  percent: number;
};

export type Tab = {
  id: number;
  name: string;
  amount: number;
  active: boolean;
};

type UsePOSArgs = {
  staffId: number;
  staffName?: string;
};

export default function usePOS({ staffId }: UsePOSArgs) {
  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------
  const [items, setItems] = useState<Item[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Customer modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState<Discount | null>(null);

  const [isBlacklisted, setIsBlacklisted] = useState(false);

  // -------------------------------------------------------
  // LOAD ITEMS
  // -------------------------------------------------------
  const loadItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .order("name");

    if (data) setItems(data as Item[]);
  };

  // -------------------------------------------------------
  // LOAD TABS
  // -------------------------------------------------------
  const loadTabs = async () => {
    const res = await fetch("/api/tabs?active=true");
    const json = await res.json();

    if (Array.isArray(json.tabs)) {
      setTabs(json.tabs as Tab[]);
    } else {
      setTabs([]);
    }
  };

  useEffect(() => {
    loadItems();
    loadTabs();
  }, []);

  // -------------------------------------------------------
  // FILTERED ITEMS
  // -------------------------------------------------------
  const filteredItems = useMemo(() => {
    const s = searchTerm.toLowerCase();

    return items.filter((item) => {
      return (
        (item.name.toLowerCase().includes(s) ||
          item.category.toLowerCase().includes(s) ||
          (item.barcode && item.barcode.includes(searchTerm))) &&
        (selectedCategory === "All" || item.category === selectedCategory)
      );
    });
  }, [items, searchTerm, selectedCategory]);

  // -------------------------------------------------------
  // CART MANAGEMENT
  // -------------------------------------------------------
  const addToCart = (item: Item) => {
    setCart((prev) => {
      const exists = prev.find((c) => c.id === item.id);
      if (exists) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        { id: item.id, name: item.name, price: item.price, quantity: 1 },
      ];
    });
  };

  const updateQty = (id: number, amt: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, item.quantity + amt) }
            : item
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  // -------------------------------------------------------
  // TOTALS
  // -------------------------------------------------------
  const originalTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discountPercent = discount ? discount.percent : 0;
  const discountAmount = (originalTotal * discountPercent) / 100;
  const finalTotal = parseFloat((originalTotal - discountAmount).toFixed(2));

  // -------------------------------------------------------
  // BLACKLIST CHECK
  // -------------------------------------------------------
  useEffect(() => {
    if (!selectedCustomer) {
      setIsBlacklisted(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    if (
      selectedCustomer.is_blacklisted &&
      selectedCustomer.blacklist_start &&
      selectedCustomer.blacklist_end &&
      selectedCustomer.blacklist_start <= today &&
      today <= selectedCustomer.blacklist_end
    ) {
      setIsBlacklisted(true);
    } else {
      setIsBlacklisted(false);
    }
  }, [selectedCustomer]);

  // -------------------------------------------------------
  // CUSTOMER SELECTION (from AddCustomerModal)
  // -------------------------------------------------------
  const handleSelectCustomer = (customer: Customer, disc: Discount | null) => {
    setSelectedCustomer(customer);
    setDiscount(disc);
    setShowCustomerModal(false);
  };

  // -------------------------------------------------------
  // REFRESH CUSTOMER (after editing)
  // -------------------------------------------------------
  const refreshCustomer = async () => {
    if (!selectedCustomer) return;

    const res = await fetch(`/api/customers?id=${selectedCustomer.id}`);
    const json = await res.json();

    if (json.customer) {
      setSelectedCustomer(json.customer);

      if (json.customer.discount_id) {
        const dres = await fetch(`/api/discounts?id=${json.customer.discount_id}`);
        const djson = await dres.json();
        setDiscount(djson.discount || null);
      } else {
        setDiscount(null);
      }
    }
  };

  // -------------------------------------------------------
  // COMPLETE SALE (including TAB PAYMENT FIX)
  // -------------------------------------------------------
  const completeSale = async () => {
    if (isBlacklisted) {
      alert("This customer is currently blacklisted.");
      return;
    }

    // ---------------------------------------------------
    // FIXED TAB DETECTION (matches "tab:ID")
    // ---------------------------------------------------
    let selectedTab: Tab | null = null;

    if (paymentMethod.startsWith("tab:")) {
      const tabId = Number(paymentMethod.split(":")[1]);
      selectedTab = tabs.find((t) => t.id === tabId) || null;
    }

    // -----------------------------
    // TAB PAYMENT LOGIC
    // -----------------------------
    if (selectedTab) {
      if (selectedTab.amount < finalTotal) {
        alert("Not enough funds on this tab.");
        return;
      }

      // Deduct from tab
      const update = await fetch("/api/tabs/update-balance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab_id: selectedTab.id,
          new_amount: selectedTab.amount - finalTotal,
        }),
      });

      if (!update.ok) {
        alert("Failed to update tab balance.");
        return;
      }
    }

    // -----------------------------
    // CREATE SALE
    // -----------------------------
    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staff_id: staffId,
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        original_total: originalTotal,
        final_total: finalTotal,
        discount_id: discount ? discount.id : null,
        payment_method: paymentMethod,
        cart,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      alert(result.error || "Sale failed");
      return;
    }

    await loadItems();
    await loadTabs();

    setCart([]);
    setIsCheckoutOpen(false);
    setSelectedCustomer(null);
    setDiscount(null);
    alert("Sale Completed!");
  };

  // -------------------------------------------------------
  // RETURN API
  // -------------------------------------------------------
  return {
    // data
    items,
    filteredItems,
    tabs,
    cart,
    searchTerm,
    selectedCategory,
    selectedCustomer,
    discount,
    originalTotal,
    discountAmount,
    finalTotal,
    paymentMethod,
    isCheckoutOpen,
    showCustomerModal,
    showEditCustomerModal,
    isBlacklisted,

    // actions
    setSearchTerm,
    setSelectedCategory,
    addToCart,
    updateQty,
    removeItem,
    setPaymentMethod,
    setIsCheckoutOpen,
    setShowCustomerModal,
    setShowEditCustomerModal,
    handleSelectCustomer,
    refreshCustomer,
    completeSale,
  };
}
