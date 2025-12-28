"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import ProductFilters from "@/components/products/ProductFilters";
import ProductsGrid from "@/components/products/ProductsGrid";
import ProductSkeleton from "@/components/products/ProductSkeleton";

import { Category } from "@/types/product";
import { useDebounce } from "@/hooks/useDebounce";
import { fetchAllProducts } from "@/utils/api";
import { getProductImage } from "@/utils/product";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function Products() {
  const router = useRouter();

  /* -------------------- React Transition -------------------- */
  const [isPending, startTransition] = useTransition();

  /* -------------------- Filters -------------------- */
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "ALL">("ALL");
  const [price, setPrice] = useState(100000);
  const debouncedSearch = useDebounce(search);

  /* -------------------- Data -------------------- */
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  /* -------------------- Search Suggestions -------------------- */
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  /* -------------------- Fetch Products -------------------- */
  const fetchProducts = async () => {
    const response = await fetchAllProducts({
      search: debouncedSearch,
      category,
      price,
      page,
      limit,
    });

    if (response?.success) {
      const mapped = response.data.map((p: any) => ({
        id: p.id,
        name: p.title,
        price: p.isOfferActive ? p.offerPrice : p.price,
        category: p.category,
        image: getProductImage(p.files),
        isOfferActive: p.isOfferActive,
        offerPrice: p.offerPrice,
      }));

      startTransition(() => {
        setProducts(mapped);
        setTotalPages(response.totalPages || 1);
      });
    } else {
      startTransition(() => {
        setProducts([]);
        setTotalPages(1);
      });
    }
  };

  /* -------------------- Main Fetch -------------------- */
  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, category, price, page]);

  /* -------------------- Search Dropdown -------------------- */
  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const fetchSearchResults = async () => {
      const res = await fetchAllProducts({
        search: debouncedSearch,
        page: 1,
        limit: 5,
      });

      if (res?.success) {
        setSearchResults(res.data);
        setShowDropdown(true);
      }
    };

    fetchSearchResults();
  }, [debouncedSearch]);

  /* -------------------- UI -------------------- */
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Products</h1>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Filters */}
        <ProductFilters
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          price={price}
          setPrice={setPrice}
          searchResults={searchResults}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          onSelectProduct={(id: string) =>
            router.push(`/user/products/${id}`)
          }
        />

        {/* Products */}
        <div className="relative">
          {/* Skeleton Overlay */}
          {isPending && (
            <div className="absolute inset-0 z-10 animate-fade-in">
              <ProductSkeleton />
            </div>
          )}

          {/* Product Grid */}
          <div
            className={`transition-opacity duration-300 ${
              isPending ? "opacity-30" : "opacity-100"
            }`}
          >
            {products.length > 0 ? (
              <ProductsGrid products={products} />
            ) : (
              !isPending && (
                <p className="text-center text-muted-foreground">
                  No products found
                </p>
              )
            )}
          </div>

          {/* Sticky Pagination */}
          {products.length > 0 && totalPages > 1 && (
            <div className="sticky bottom-0 bg-background pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-disabled={page === 1}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={page === i + 1}
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      aria-disabled={page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
