"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import ProductFilters from "@/components/products/ProductFilters";
import ProductsGrid from "@/components/products/ProductsGrid";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import ProductPopupBanner from "@/components/products/ProductPopupBanner";

import { Category } from "@/types/product";
import { useDebounce } from "@/hooks/useDebounce";
import { fetchAllProducts, fetchBrands, fetchCategories } from "@/utils/api";
import { getProductImage } from "@/utils/product";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAddToCartMutation } from "@/redux/services/cartApi";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Products() {
  const router = useRouter();

  /* -------------------- React Transition -------------------- */
  // const [loading, startTransition] = useTransition();

  /* -------------------- Filters -------------------- */
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [brand, setBrand] = useState<string>("");
  const debouncedSearch = useDebounce(search);
  const [loading,setLoading] = useState(true)

  /* -------------------- Options -------------------- */
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  /* -------------------- Data -------------------- */
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  /* -------------------- Search Suggestions -------------------- */
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addToCart] = useAddToCartMutation()

  /* -------------------- Fetch Products -------------------- */
  const fetchProducts = async () => {
    setLoading(true)
    const response = await fetchAllProducts({
      search: debouncedSearch,
      category,
      minPrice,
      maxPrice,
      brand,
      page,
      limit,
    });

    if (response?.success) {
      const mapped = response.data.map((p: any) => ({
        id: p.id,
        name: p.title,
        price: p.isOfferActive ? p.offerPrice : p.sellingPrice, // Updated to use sellingPrice if no offer
        sellingPrice: p.sellingPrice,
        offerPrice: p.offerPrice,
        category: p.category,
        image: getProductImage(p.files),
        isOfferActive: p.isOfferActive,
        isInCart: p.isInCart,
        cartQuantity: p.cartQuantity,
        isInWishlist: p.isInWishlist,
        averageRating: p.averageRating,
        totalReviews: p.totalReviews,
      }));
      setProducts(mapped);
      setTotalPages(response.totalPages || 1);

      // startTransition(() => {
      //   setProducts(mapped);
      //   setTotalPages(response.totalPages || 1);
      // });
    } else {
      // startTransition(() => {
      //   setProducts([]);
      //   setTotalPages(1);
      // });
      setProducts([])
      toast("Something went wrong while fetching products")
    }
    setLoading(false)
  };

  const handleProductAddedToCart = (productId:string)=>{
    setProducts((prev)=>prev.map((product)=>product.id ===productId ? {...product,isInCart:true,cartQuantity:(product.cartQuantity ?? 0)+1}:product))
  }

  const handleProductDecreaseFromCart = (productId:string)=>{
    setProducts((prev)=> prev.map((product)=>
      {
        if(product.id === productId){
          if(product.cartQuantity === 1){
            return {...product,isInCart:false,cartQuantity:0}
          }else{
            return {...product,isInCart:true,cartQuantity:(product.cartQuantity ?? 1)-1}
          }

        }else{
          return product
        }
      }))
  }

  const handleProductDeleteFromCart = (productId:string)=>{
    setProducts((prev)=>prev.map((product)=>product.id ===productId ? {...product,isInCart:false,cartQuantity:0}:product))
  }
  
  const handleProductToggleWishlist = (productId: string) => {
    setProducts((prev) => prev.map((product) => 
      product.id === productId ? { ...product, isInWishlist: !product.isInWishlist } : product
    ));
  }
  useEffect(() => {
    const loadInitialData = async () => {
      const [brandsRes, catRes] = await Promise.all([
        fetchBrands(),
        fetchCategories()
      ]);
      if (brandsRes.success) setBrands(brandsRes.data);
      if (catRes.success) setCategories(catRes.data);
    };
    loadInitialData();
  }, []);

  /* -------------------- Main Fetch -------------------- */
  useEffect(() => {
    fetchProducts();
  }, [category, minPrice, maxPrice, brand, page]);

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
    <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <ProductPopupBanner />
      <div className="mb-8 p-8 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20">
        <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[var(--foreground)] to-[var(--foreground-muted)] tracking-tight">
          Discover Products
        </h1>
        <p className="text-[var(--foreground-muted)] mt-2 font-medium">
          Find the best items tailored just for you.
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        {/* Filters */}
        <ProductFilters
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          brand={brand}
          setBrand={setBrand}
          searchResults={searchResults}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          onSelectProduct={(id: string) =>
            router.push(`/user/products/${id}`)
          }
          categories={categories}
          brands={brands}
        />

        {/* Products */}
        <div className="relative">
          {/* Skeleton Overlay */}
          {loading && (
            <div className="">
               {/* <Skeleton className="h-[300px] w-[300px] rounded-full bg-amber-500" /> */}
              <ProductSkeleton />
            </div>
          )}

          {/* Product Grid */}
          <div
            className={`transition-opacity duration-300 ${
              loading ? "opacity-30" : "opacity-100"
            }`}
          >
            {products?.length > 0 ? (
              <ProductsGrid 
                products={products} 
                handleProductAddedToCart={handleProductAddedToCart} 
                handleProductDecreaseFromCart={handleProductDecreaseFromCart} 
                handleProductDeleteFromCart={handleProductDeleteFromCart}
                handleProductToggleWishlist={handleProductToggleWishlist}
              />
            ) : (
              !loading && (
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
                    <PaginationItem key={i} className="cursor-pointer">
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
