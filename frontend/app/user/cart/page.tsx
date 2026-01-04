"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

import {
  useGetCartItemsQuery,
  useAddToCartMutation,
  useDecreaseFromCartMutation,
  useDeleteFromCartMutation,
} from "@/redux/services/cartApi";

export default function CartPage() {
  const router = useRouter();

  const { data, isLoading, isFetching, refetch } = useGetCartItemsQuery();
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [decreaseFromCart, { isLoading: decreasing }] =
    useDecreaseFromCartMutation();
  const [removeFromCart, { isLoading: removing }] =
    useDeleteFromCartMutation();

  const [coupon, setCoupon] = useState("");
  const isProcessing = adding || decreasing || removing;

  const items = data?.data?.items || [];
  const total = data?.data?.total || 0;

  /* ================= HANDLERS ================= */

  const handleIncrease = async (productId: string) => {
    try {
      await addToCart(productId).unwrap();
      toast.success("Quantity increased");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to increase quantity");
    }
  };

  const handleDecrease = async (productId: string, quantity: number) => {
    try {
      if (quantity === 1) {
        await removeFromCart(productId).unwrap();
        toast.success("Item removed");
      } else {
        await decreaseFromCart(productId).unwrap();
        toast.success("Quantity decreased");
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update cart");
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeFromCart(productId).unwrap();
      toast.success("Item removed from cart");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to remove item");
    }
  };

  const handleApplyCoupon = () => {
    if (!coupon) {
      toast.error("Please enter a coupon code");
      return;
    }
    // Hook backend later
    toast.success(`Coupon "${coupon}" applied`);
  };

  /* ================= UI ================= */

  if (isLoading) {
    return <div className="p-10 text-center">Loading cart...</div>;
  }

  if (!items.length) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center">
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <button
          onClick={() => router.push("/")}
          className="mt-4 bg-black text-white px-6 py-3 rounded-md"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
      {/* LOADING OVERLAY */}
      {(isFetching || isProcessing) && (
        <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ================= LEFT: CART ITEMS ================= */}
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-2xl font-semibold">Shopping Cart</h1>

        {items.map((item: any) => {
          const product = item.product;
          const price = product.isOfferActive
            ? product.offerPrice
            : product.price;

          return (
            <div
              key={item.id}
              className="flex gap-4 border rounded-xl p-4"
            >
              {/* IMAGE */}
              <div className="relative w-24 h-24">
                <Image
                  src={product.files[0]?.url}
                  alt={product.title}
                  fill
                  className="object-cover rounded-md"
                />
              </div>

              {/* DETAILS */}
              <div className="flex-1">
                <h3 className="font-medium">{product.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {product.description}
                </p>

                <p className="mt-1 font-semibold">₹{price}</p>

                {/* QUANTITY */}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() =>
                      handleDecrease(product.id, item.quantity)
                    }
                    className="w-8 h-8 border rounded-md font-bold"
                  >
                    −
                  </button>

                  <span className="font-semibold">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => handleIncrease(product.id)}
                    className="w-8 h-8 border rounded-md font-bold"
                  >
                    +
                  </button>

                  <button
                    onClick={() => handleRemove(product.id)}
                    className="ml-4 text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* ITEM TOTAL */}
              <div className="font-semibold">
                ₹{price * item.quantity}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= RIGHT: SUMMARY ================= */}
      <div className="border rounded-xl p-6 space-y-6 h-fit">
        <h2 className="text-lg font-semibold">Order Summary</h2>

        {/* COUPON */}
        <div>
          <label className="text-sm font-medium">Apply Coupon</label>
          <div className="mt-2 flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 border rounded-md px-3 py-2 text-sm"
            />
            <button
              onClick={handleApplyCoupon}
              className="bg-black text-white px-4 rounded-md text-sm"
            >
              Apply
            </button>
          </div>
        </div>

        {/* PRICE DETAILS */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{total}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>

        {/* CHECKOUT */}
        <button
          onClick={() => router.push("/checkout")}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
