"use client";

import { Category } from "@/types/product";

interface Props {
  search: string;
  setSearch: (v: string) => void;
  category: Category | "ALL";
  setCategory: (v: Category | "ALL") => void;
  price: number;
  setPrice: (v: number) => void;
}

export default function ProductFilters({
  search,
  setSearch,
  category,
  setCategory,
  price,
  setPrice,
}: Props) {
  return (
    <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm">
      {/* Search */}
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />

      {/* Category */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as any)}
        className="w-full border rounded-lg px-3 py-2"
      >
        <option value="ALL">All Categories</option>
        <option value={Category.ELECTRONICS}>Electronics</option>
        <option value={Category.CLOTHES}>Clothes</option>
        <option value={Category.DAILY_USAGE}>Daily Usage</option>
      </select>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium">Max Price: ₹{price}</label>
        <input
          type="range"
          min={0}
          max={100000}
          step={500}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
