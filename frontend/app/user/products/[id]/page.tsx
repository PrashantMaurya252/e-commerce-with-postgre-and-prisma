"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { Star, ShoppingCart, Percent, TrendingUp, CheckCircle, Package } from "lucide-react";

import ProductImageGallery from "@/components/products/ProductImageGallery";
import ProductImageGallerySkeleton from "@/components/products/ProductImageGallerySkeleton";
import ProductDetailsSkeleton from "@/components/products/ProductsDetailsSkeleton";

import { productDetails } from "@/utils/api";
import {
  useAddToCartMutation,
  useDecreaseFromCartMutation,
  useDeleteFromCartMutation,
} from "@/redux/services/cartApi";

interface Product {
  id: string;
  title: string;
  description: string;
  sellingPrice: number;
  offerPrice: number;
  isOfferActive: boolean;
  itemLeft: number;
  files: any[];
  isInCart: boolean;
  cartQuantity: number;
  averageRating: number;
  totalReviews: number;
  brand: string;
  category?: { name: string };
}

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [decreaseFromCart, { isLoading: decreasing }] =
    useDecreaseFromCartMutation();
  const [removeFromCart, { isLoading: removing }] =
    useDeleteFromCartMutation();

  const isProcessing = adding || decreasing || removing;

  /* ================= FETCH PRODUCT ================= */

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productDetails(id);
        if (res.success && res.data) {
          setProduct(res.data);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  /* ================= OPTIMISTIC HELPERS ================= */

  const optimisticAdd = () => {
    if (!product) return;
    setProduct({
      ...product,
      isInCart: true,
      cartQuantity: product.cartQuantity + 1,
    });
  };

  const optimisticDecrease = () => {
    if (!product) return;
    setProduct({
      ...product,
      cartQuantity: product.cartQuantity - 1,
    });
  };

  const optimisticRemove = () => {
    if (!product) return;
    setProduct({
      ...product,
      isInCart: false,
      cartQuantity: 0,
    });
  };

  /* ================= HANDLERS ================= */

  const handleAdd = async () => {
    optimisticAdd();

    try {
      await addToCart(product!.id).unwrap();
      toast.success("Added to cart");
    } catch (error: any) {
      optimisticDecrease(); // rollback
      toast.error(error?.data?.message || "Failed to add item");
    }
  };

  const handleIncrease = async () => {
    optimisticAdd();

    try {
      await addToCart(product!.id).unwrap();
      toast.success("Quantity increased");
    } catch (error: any) {
      optimisticDecrease();
      toast.error(error?.data?.message || "Failed to increase quantity");
    }
  };

  const handleDecrease = async () => {
    if (!product) return;

    if (product.cartQuantity === 1) {
      optimisticRemove();

      try {
        await removeFromCart(product.id).unwrap();
        toast.success("Item removed");
      } catch (error: any) {
        optimisticAdd(); // rollback
        toast.error(error?.data?.message || "Failed to remove item");
      }
      return;
    }

    optimisticDecrease();

    try {
      await decreaseFromCart(product.id).unwrap();
      toast.success("Quantity updated");
    } catch (error: any) {
      optimisticAdd(); // rollback
      toast.error(error?.data?.message || "Failed to update quantity");
    }
  };

  const handleRemove = async () => {
    optimisticRemove();

    try {
      await removeFromCart(product!.id).unwrap();
      toast.success("Item removed");
    } catch (error: any) {
      optimisticAdd();
      toast.error(error?.data?.message || "Failed to remove item");
    }
  };

  /* ================= UI ================= */

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative">
        {/* GLOBAL LOADING OVERLAY */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 rounded-xl">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* IMAGE SECTION */}
        {loading ? (
          <ProductImageGallerySkeleton />
        ) : product ? (
          <ProductImageGallery images={product.files} />
        ) : null}

        {/* DETAILS SECTION */}
        {loading ? (
          <ProductDetailsSkeleton />
        ) : product ? (
          <div className="space-y-8 py-4">
            {/* BADGES & BRAND */}
            <div className="flex flex-wrap items-center gap-3">
              {product.brand && (
                <span className="px-3 py-1 bg-[var(--surface-2)] text-[var(--foreground-muted)] text-xs font-bold uppercase tracking-wider rounded-lg">
                  {product.brand}
                </span>
              )}
              {product.itemLeft < 10 && product.itemLeft > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-lg">
                  <TrendingUp size={14} /> Almost Gone!
                </span>
              )}
            </div>

            {/* TITLE & REVIEWS */}
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tight mb-4">
                {product.title}
              </h1>
              
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-lg">
                  <Star size={16} className="fill-current" />
                  <span className="text-sm font-bold">{product.averageRating > 0 ? product.averageRating.toFixed(1) : "New"}</span>
                </div>
                <span className="text-[var(--foreground-muted)] underline decoration-dashed underline-offset-4 cursor-pointer hover:text-[var(--foreground)] transition-colors">
                  {product.totalReviews} Reviews
                </span>
              </div>
            </div>

            <div className="h-px bg-[var(--border)] w-full" />

            {/* DESCRIPTION */}
            <p className="text-[var(--foreground-muted)] text-base md:text-lg leading-relaxed max-w-[90%]">
              {product.description}
            </p>

            {/* PRICE AREA */}
            <div className="bg-[var(--surface-2)] rounded-2xl p-6 border border-[var(--border)]">
              <div className="flex flex-wrap items-end gap-4 mb-4">
                <span className="text-4xl md:text-5xl font-black text-[var(--foreground)] tracking-tighter">
                  ₹{product.sellingPrice > product.offerPrice ? product.offerPrice : product.sellingPrice}
                </span>

                {product.sellingPrice > product.offerPrice && (
                  <>
                    <span className="text-xl font-semibold text-[var(--foreground-muted)] line-through mb-1">
                      ₹{product.sellingPrice}
                    </span>
                    <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg mb-1.5">
                      <Percent size={16} />
                      <span className="text-sm font-bold">
                        {Math.round(((product.sellingPrice - product.offerPrice) / product.sellingPrice) * 100)}% OFF
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)]">
                <CheckCircle size={16} className="text-emerald-500" />
                <span>Price inclusive of all taxes</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Package size={20} className="text-[var(--foreground-muted)]" />
              <p className="text-sm font-bold text-[var(--foreground)]">
                {product.itemLeft > 0 ? (
                  <span className={product.itemLeft < 10 ? "text-rose-500" : "text-emerald-500"}>
                    {product.itemLeft} items in stock
                  </span>
                ) : (
                  <span className="text-rose-500">Out of Stock</span>
                )}
              </p>
            </div>

            {/* ACTIONS */}
            {!product.isInCart ? (
              <button
                onClick={handleAdd}
                disabled={product.itemLeft === 0}
                className="w-full flex items-center justify-center gap-3 bg-[var(--foreground)] text-[var(--background)] px-8 py-4 rounded-2xl hover:scale-[1.02] hover:shadow-xl hover:shadow-[var(--foreground)]/10 transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:pointer-events-none"
              >
                <ShoppingCart size={20} />
                {product.itemLeft === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 bg-[var(--surface-2)] p-2 rounded-3xl border border-[var(--border)]">
                <div className="flex items-center justify-between px-6 py-2 flex-1">
                  <button
                    onClick={handleDecrease}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--card)] hover:text-rose-500 hover:shadow-md transition-all text-xl font-bold"
                  >
                    −
                  </button>

                  <span className="text-xl font-black w-8 text-center">
                    {product.cartQuantity}
                  </span>

                  <button
                    onClick={handleIncrease}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--card)] hover:text-emerald-500 hover:shadow-md transition-all text-xl font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="flex gap-2 flex-1">
                  <button
                    onClick={handleRemove}
                    className="flex-1 border-2 border-transparent text-rose-500 bg-rose-500/10 hover:border-rose-500/30 px-6 py-4 rounded-2xl font-bold transition-all"
                  >
                    Remove
                  </button>

                  <button
                    onClick={() => router.push("/user/cart")}
                    className="flex-1 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all font-bold"
                  >
                    Go to Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p>Product not found</p>
        )}
      </div>
    </div>
  );
}
