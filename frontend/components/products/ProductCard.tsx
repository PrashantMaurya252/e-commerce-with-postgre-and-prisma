"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, Star, ShoppingCart } from "lucide-react";

import { Product } from "@/types/product";
import {
  useAddToCartMutation,
  useDecreaseFromCartMutation,
  useDeleteFromCartMutation,
} from "@/redux/services/cartApi";
import { useToggleWishlistItemMutation } from "@/redux/services/wishlistApi";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";

export default function ProductCard({
  product,
  handleProductAddedToCart,
  handleProductDecreaseFromCart,
  handleProductDeleteFromCart,
  handleProductToggleWishlist,
}: {
  product: Product;
  handleProductAddedToCart: (id: string) => void;
  handleProductDecreaseFromCart: (id: string) => void;
  handleProductDeleteFromCart: (id: string) => void;
  handleProductToggleWishlist?: (id: string) => void;
}) {
  const router = useRouter();

  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [decreaseFromCart, { isLoading: decreasing }] =
    useDecreaseFromCartMutation();
  const [removeFromCart, { isLoading: removing }] =
    useDeleteFromCartMutation();

  const isProcessing = adding || decreasing || removing;
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);

  const [toggleWishlist, { isLoading: togglingWishlist }] = useToggleWishlistItemMutation();

  /* ================= HANDLERS ================= */

  /* ADD */
  const handleAdd = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to add items to cart", {
        action: {
          label: "Login",
          onClick: () => router.push("/auth/login"),
        },
      });
      return;
    }

    handleProductAddedToCart(product.id); // optimistic

    try {
      await addToCart(product.id).unwrap();
      toast.success("Added to cart");
    } catch (error: any) {
      handleProductDecreaseFromCart(product.id); // rollback
      toast.error(error?.data?.message || "Failed to add item");
    }
  };

  /* DECREASE */
  const handleDecrease = async () => {
    if (product.cartQuantity === 1) {
      handleProductDeleteFromCart(product.id); // optimistic remove

      try {
        await removeFromCart(product.id).unwrap();
        toast.success("Item removed from cart");
      } catch (error: any) {
        handleProductAddedToCart(product.id); // rollback
        toast.error(error?.data?.message || "Failed to remove item");
      }
      return;
    }

    handleProductDecreaseFromCart(product.id); // optimistic decrease

    try {
      await decreaseFromCart(product.id).unwrap();
      toast.success("Quantity updated");
    } catch (error: any) {
      handleProductAddedToCart(product.id); // rollback
      toast.error(error?.data?.message || "Failed to update quantity");
    }
  };

  /* INCREASE */
  const handleIncrease = async () => {
    handleProductAddedToCart(product.id); // optimistic

    try {
      await addToCart(product.id).unwrap();
      toast.success("Quantity increased");
    } catch (error: any) {
      handleProductDecreaseFromCart(product.id); // rollback
      toast.error(error?.data?.message || "Failed to increase quantity");
    }
  };

  /* REMOVE */
  const handleRemove = async () => {
    handleProductDeleteFromCart(product.id); // optimistic

    try {
      await removeFromCart(product.id).unwrap();
      toast.success("Item removed");
    } catch (error: any) {
      handleProductAddedToCart(product.id); // rollback
      toast.error(error?.data?.message || "Failed to remove item");
    }
  };

  /* TOGGLE WISHLIST */
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to manage wishlist", {
        action: { label: "Login", onClick: () => router.push("/auth/login") },
      });
      return;
    }

    if (handleProductToggleWishlist) {
      handleProductToggleWishlist(product.id); // optimistic
    }
    try {
      await toggleWishlist(product.id).unwrap();
    } catch (error: any) {
      if (handleProductToggleWishlist) {
        handleProductToggleWishlist(product.id); // rollback
      }
      toast.error(error?.data?.message || "Failed to update wishlist");
    }
  };

  /* ================= UI ================= */

  const isDiscounted = product.sellingPrice > product.offerPrice;
  const displayPrice = isDiscounted ? product.offerPrice : product.sellingPrice;
  const discountPercentage = isDiscounted
    ? Math.round(((product.sellingPrice - product.offerPrice) / product.sellingPrice) * 100)
    : 0;

  return (
    <div
      className={`group flex flex-col bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-300 relative
        ${isProcessing ? "opacity-60 pointer-events-none" : "hover:shadow-xl hover:border-emerald-500/30 hover:-translate-y-1"}
      `}
    >
      {/* LOADING OVERLAY */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* IMAGE */}
      <div
        className="relative h-56 w-full cursor-pointer bg-[var(--surface-2)] overflow-hidden"
        onClick={() => router.push(`/user/products/${product.id}`)}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm z-10">
            {discountPercentage}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={togglingWishlist}
          className="absolute top-2 left-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Heart
            size={18}
            className={`transition-colors ${product.isInWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
              }`}
          />
        </button>
      </div>

      {/* INFO */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider">{product.category}</span>
          <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-xs font-bold">
            <Star size={12} className="fill-current" />
            <span>{product.averageRating > 0 ? product.averageRating.toFixed(1) : "New"}</span>
          </div>
        </div>

        <h3
          className="font-bold text-base line-clamp-2 text-[var(--foreground)] mb-2 cursor-pointer hover:text-emerald-500 transition-colors"
          onClick={() => router.push(`/user/products/${product.id}`)}
        >
          {product.name}
        </h3>

        <div className="mt-auto pt-2 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-[var(--foreground)]">₹{displayPrice}</span>
              {isDiscounted && (
                <span className="text-sm font-medium text-[var(--foreground-muted)] line-through">
                  ₹{product.sellingPrice}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-4">
          {!product.isInCart ? (
            <button
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-2 bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-emerald-500 hover:text-white py-2.5 rounded-xl text-sm font-bold transition-all duration-300"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2 bg-[var(--surface-2)] rounded-xl p-1">
              <button
                onClick={handleDecrease}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--card)] shadow-sm text-lg font-bold hover:text-emerald-500 transition-colors"
              >
                −
              </button>

              <span className="text-sm font-bold w-4 text-center">
                {product.cartQuantity}
              </span>

              <button
                onClick={handleIncrease}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--card)] shadow-sm text-lg font-bold hover:text-emerald-500 transition-colors"
              >
                +
              </button>
            </div>
          )}

          {/* REMOVE + GO TO CART */}
          {product.isInCart && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleRemove}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                Remove
              </button>

              <button
                onClick={() => router.push("/user/cart")}
                className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
              >
                Go to Cart
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
