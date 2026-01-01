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
import { useAddToCartMutation } from "@/redux/services/cartApi";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Products() {
  const router = useRouter();

  /* -------------------- React Transition -------------------- */
  // const [loading, startTransition] = useTransition();

  /* -------------------- Filters -------------------- */
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "ALL">("ALL");
  const [price, setPrice] = useState(100000);
  const debouncedSearch = useDebounce(search);
  const [loading,setLoading] = useState(true)

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
        isInCart:p.isInCart,
        cartQuantity:p.cartQuantity
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
    setProducts((prev)=>prev.map((product)=>product.id ===productId ? {...product,isInCart:true,quantity:(product.quantity ?? 0)+1}:product))
  }

  const handleProductDecreaseFromCart = (productId:string)=>{
    setProducts((prev)=> prev.map((product)=>
      {
        if(product.id === productId){
          if(product.quantity === 1){
            return {...product,isInCart:false,quantity:0}
          }else{
            return {...product,isInCart:true,quantity:(product.quantity ?? 1)-1}
          }

        }else{
          return product
        }
      }))
  }

  const handleProductDeleteFromCart = (productId:string)=>{
    setProducts((prev)=>prev.map((product)=>product.id ===productId ? {...product,isInCart:false,quantity:0}:product))
  }
  /* -------------------- Main Fetch -------------------- */
  useEffect(() => {
    fetchProducts();
  }, [ category, price, page]);

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

  console.log("loading",loading)

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
              <ProductsGrid products={products} handleProductAddedToCart={handleProductAddedToCart} handleProductDecreaseFromCart={handleProductDecreaseFromCart}/>
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
