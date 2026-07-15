"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart } from "lucide-react";

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

  return (
    <div
      className={`border border-[var(--border)] bg-[var(--card)] rounded-xl p-4 transition relative
        ${isProcessing ? "opacity-60 pointer-events-none" : "hover:shadow-lg hover:border-primary/30"}
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
        className="relative h-40 mb-3 cursor-pointer"
        onClick={() => router.push(`/user/products/${product.id}`)}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover rounded-lg"
        />
        <button
          onClick={handleWishlistToggle}
          disabled={togglingWishlist}
          className="absolute top-2 left-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Heart
            size={18}
            className={`transition-colors ${
              product.isInWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>
      </div>

      {/* INFO */}
      <h3 className="font-medium text-sm line-clamp-1 text-[var(--foreground)]">{product.name}</h3>
      <p className="text-primary font-semibold">₹{product.price}</p>

      {/* ACTIONS */}
      {!product.isInCart ? (
        <button
          onClick={handleAdd}
          className="mt-3 w-full bg-primary text-white py-2 rounded-md text-sm hover:bg-primary-hover transition-colors"
        >
          Add to Cart
        </button>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            onClick={handleDecrease}
            className="w-9 h-9 rounded-md border text-lg font-bold hover:bg-gray-100"
          >
            −
          </button>

          <span className="text-sm font-semibold">
            {product.cartQuantity}
          </span>

          <button
            onClick={handleIncrease}
            className="w-9 h-9 rounded-md border text-lg font-bold hover:bg-gray-100"
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
            className="flex-1 border border-red-500 text-red-600 py-2 rounded-md text-sm hover:bg-red-50"
          >
            Remove
          </button>

          <button
            onClick={() => router.push("/user/cart")}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700"
          >
            Go to Cart
          </button>
        </div>
      )}

      {/* VIEW DETAILS */}
      <button
        onClick={() => router.push(`/user/products/${product.id}`)}
        className="mt-3 w-full text-sm text-[var(--foreground-muted)] hover:text-primary transition-colors underline"
      >
        View Details
      </button>

      {/* BADGE */}
      {product.isInCart && (
        <span className="absolute top-2 right-2 text-xs bg-green-600 text-white px-2 py-1 rounded-full">
          In Cart
        </span>
      )}
    </div>
  );
}
