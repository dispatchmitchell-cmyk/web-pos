// app/pos/components/POSItems.tsx
"use client";

import React from "react";

type Item = {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string | null;
  category: string;
};

type POSItemsProps = {
  items?: Item[];                     // may come in undefined
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  addToCart: (item: Item) => void;
};

export default function POSItems({
  items,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  addToCart,
}: POSItemsProps) {
  // Always work with a real array
  const safeItems: Item[] = Array.isArray(items) ? items : [];

  const accentColors: Record<string, string> = {
    Food: "#F97316",
    Drink: "#38BDF8",
    Alcohol: "#FB7185",
    Specials: "#A855F7",
  };

  const filteredItems = safeItems.filter((item) => {
    const s = searchTerm.toLowerCase();
    return (
      (item.name.toLowerCase().includes(s) ||
        item.category.toLowerCase().includes(s) ||
        (item.barcode && item.barcode.includes(searchTerm))) &&
      (selectedCategory === "All" || item.category === selectedCategory)
    );
  });

  return (
    <div className="flex-1 pt-24 p-6 overflow-y-auto">
      {/* Category buttons */}
      <div className="flex gap-3 mb-4">
        {["All", "Food", "Drink", "Alcohol"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategory === cat
                ? "bg-slate-50 text-slate-900 shadow"
                : "bg-slate-800 text-slate-200 border border-slate-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search items..."
        className="w-full p-3 rounded-lg mb-6 bg-slate-900 border border-slate-700 text-slate-50 placeholder:text-slate-400 shadow-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Items grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => addToCart(item)}
            className="bg-slate-900 rounded-xl shadow hover:shadow-lg cursor-pointer transition transform hover:scale-[1.02] overflow-hidden border border-slate-700"
          >
            <div
              style={{ backgroundColor: accentColors[item.category] }}
              className="h-1.5 w-full"
            />
            <div className="p-4">
              <h2 className="font-semibold text-lg text-slate-50">
                {item.name}
              </h2>
              <p className="text-slate-400 text-sm">{item.category}</p>
              <p className="mt-2 text-xl font-bold text-slate-50">
                ${item.price.toFixed(2)}
              </p>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <p className="text-slate-500 col-span-full text-center mt-10">
            No items found.
          </p>
        )}
      </div>
    </div>
  );
}
