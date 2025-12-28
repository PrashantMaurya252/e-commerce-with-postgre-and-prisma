import { Dispatch, SetStateAction } from "react";
import { Category } from "@/types/product";
import { Input } from "@/components/ui/input";

interface Props {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;

  category: Category | "ALL";
  setCategory: Dispatch<SetStateAction<Category | "ALL">>;

  price: number;
  setPrice: Dispatch<SetStateAction<number>>;

  /* 🔥 NEW */
  searchResults: any[];
  showDropdown: boolean;
  setShowDropdown: Dispatch<SetStateAction<boolean>>;
  onSelectProduct: (id: string) => void;
}

export default function ProductFilters({
  search,
  setSearch,
  category,
  setCategory,
  price,
  setPrice,
  searchResults,
  showDropdown,
  setShowDropdown,
  onSelectProduct,
}: Props) {
  return (
    <div className="space-y-4 relative">
      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => searchResults.length && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        />

        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow">
            {searchResults.map((p) => (
              <div
                key={p.id}
                className="px-4 py-2 cursor-pointer hover:bg-muted text-sm"
                onClick={() => onSelectProduct(p.id)}
              >
                {p.title}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category / Price filters stay same */}
      {/* ... */}
    </div>
  );
}
