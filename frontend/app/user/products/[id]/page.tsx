"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

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
  price: number;
  offerPrice: number;
  isOfferActive: boolean;
  itemLeft: number;
  files: any[];
  isInCart: boolean;
  cartQuantity: number;
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
          <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-semibold">
              {product.title}
            </h1>

            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              {product.description}
            </p>

            {/* PRICE */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold">
                ₹{product.isOfferActive ? product.offerPrice : product.price}
              </span>

              {product.isOfferActive && (
                <span className="line-through text-gray-500">
                  ₹{product.price}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500">
              {product.itemLeft} items left
            </p>

            {/* ACTIONS */}
            {!product.isInCart ? (
              <button
                onClick={handleAdd}
                className="w-full md:w-auto bg-black text-white px-8 py-3 rounded-md hover:bg-gray-900"
              >
                Add to Cart
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleDecrease}
                    className="w-10 h-10 border rounded-md text-lg font-bold"
                  >
                    −
                  </button>

                  <span className="text-lg font-semibold">
                    {product.cartQuantity}
                  </span>

                  <button
                    onClick={handleIncrease}
                    className="w-10 h-10 border rounded-md text-lg font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRemove}
                    className="border border-red-500 text-red-600 px-6 py-2 rounded-md hover:bg-red-50"
                  >
                    Remove
                  </button>

                  <button
                    onClick={() => router.push("/user/cart")}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
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
