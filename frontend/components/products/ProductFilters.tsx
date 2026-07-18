import { Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";

interface Props {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  category: string;
  setCategory: Dispatch<SetStateAction<string>>;
  minPrice: number | undefined;
  setMinPrice: Dispatch<SetStateAction<number | undefined>>;
  maxPrice: number | undefined;
  setMaxPrice: Dispatch<SetStateAction<number | undefined>>;
  brand: string;
  setBrand: Dispatch<SetStateAction<string>>;
  searchResults: any[];
  showDropdown: boolean;
  setShowDropdown: Dispatch<SetStateAction<boolean>>;
  onSelectProduct: (id: string) => void;
  categories: any[];
  brands: string[];
}

export default function ProductFilters({
  search,
  setSearch,
  category,
  setCategory,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  brand,
  setBrand,
  searchResults,
  showDropdown,
  setShowDropdown,
  onSelectProduct,
  categories,
  brands,
}: Props) {
  return (
    <div className="space-y-6 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border-2)]">
      {/* Search */}
      <div className="relative">
        <label className="text-sm font-semibold mb-2 block">Search</label>
        <Input
          placeholder="Search title or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => searchResults.length && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        />
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-[var(--border-2)] bg-[var(--surface-2)] shadow-lg">
            {searchResults.map((p) => (
              <div
                key={p.id}
                className="px-4 py-2 cursor-pointer hover:bg-[var(--surface-3)] text-sm"
                onClick={() => onSelectProduct(p.id)}
              >
                {p.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="text-sm font-semibold mb-2 block">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="ALL">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label || cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Brand */}
      <div>
        <label className="text-sm font-semibold mb-2 block">Brand</label>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range (Offer Price) */}
      <div>
        <label className="text-sm font-semibold mb-2 block">Offer Price Range</label>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice ?? ""}
            onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice ?? ""}
            onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>
    </div>
  );
}
