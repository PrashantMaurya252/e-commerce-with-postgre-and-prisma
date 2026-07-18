"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ProductsGrid from "@/components/products/ProductsGrid";
import { useGetWishlistItemsQuery } from "@/redux/services/wishlistApi";
import { getProductImage } from "@/utils/product";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetWishlistItemsQuery();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (data?.success) {
      const mapped = data.data.items.map((item: any) => {
        const p = item.product;
        return {
          id: p.id,
          name: p.title,
          price: p.isOfferActive ? p.offerPrice : p.price,
          category: p.category,
          image: getProductImage(p.files),
          isOfferActive: p.isOfferActive,
          offerPrice: p.offerPrice,
          isInCart: p.cartItems?.length > 0,
          cartQuantity: p.cartItems?.[0]?.quantity || 0,
          isInWishlist: true // Always true on this page
        };
      });
      setProducts(mapped);
    }
  }, [data]);

  const handleProductAddedToCart = (productId: string) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, isInCart: true, cartQuantity: (product.cartQuantity ?? 0) + 1 }
          : product
      )
    );
  };

  const handleProductDecreaseFromCart = (productId: string) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id === productId) {
          if (product.cartQuantity === 1) {
            return { ...product, isInCart: false, cartQuantity: 0 };
          } else {
            return { ...product, isInCart: true, cartQuantity: (product.cartQuantity ?? 1) - 1 };
          }
        }
        return product;
      })
    );
  };

  const handleProductDeleteFromCart = (productId: string) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, isInCart: false, cartQuantity: 0 } : product
      )
    );
  };

  const handleProductToggleWishlist = (productId: string) => {
    // Optimistically remove from grid
    setProducts((prev) => prev.filter((product) => product.id !== productId));
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 min-h-[70vh]">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">My Wishlist</h1>
        <span className="ml-auto text-[var(--foreground-muted)] font-medium bg-[var(--surface-2)] px-4 py-1.5 rounded-full">
          {products.length} Items
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-[var(--surface-2)] rounded-2xl"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">Failed to load wishlist items.</p>
          <button onClick={() => refetch()} className="text-primary hover:underline">
            Try Again
          </button>
        </div>
      ) : products.length > 0 ? (
        <ProductsGrid
          products={products}
          handleProductAddedToCart={handleProductAddedToCart}
          handleProductDecreaseFromCart={handleProductDecreaseFromCart}
          handleProductDeleteFromCart={handleProductDeleteFromCart}
          handleProductToggleWishlist={handleProductToggleWishlist}
        />
      ) : (
        <div className="text-center py-24 bg-[var(--card)] border border-[var(--border)] rounded-3xl">
          <Heart className="w-16 h-16 text-[var(--surface-2)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Your wishlist is empty</h2>
          <p className="text-[var(--foreground-muted)] mb-6 max-w-md mx-auto">
            Save items you love to your wishlist. Review them anytime and easily move them to your cart.
          </p>
          <button
            onClick={() => router.push("/user/products")}
            className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
          >
            Explore Products
          </button>
        </div>
      )}
    </main>
  );
}
