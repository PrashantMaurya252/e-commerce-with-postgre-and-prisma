"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import {
  useGetCartItemsQuery,
  useAddToCartMutation,
  useDecreaseFromCartMutation,
  useDeleteFromCartMutation,
} from "@/redux/services/cartApi";

import { getAllCoupons, applyCoupon, checkout } from "@/utils/api";
import { Coupon, CouponListItem } from "@/types/cart";

export default function CartPage() {
  const router = useRouter();

  const { data, isLoading, isFetching, refetch } = useGetCartItemsQuery();
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [decreaseFromCart, { isLoading: decreasing }] =
    useDecreaseFromCartMutation();
  const [removeFromCart, { isLoading: removing }] =
    useDeleteFromCartMutation();

  const [coupon, setCoupon] = useState("");
  const [allCoupons, setAllCoupons] = useState<CouponListItem[]>([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const isProcessing = adding || decreasing || removing;
  const items = data?.data?.items || [];
  const total = data?.data?.total || 0;

  /* ================= COUPONS ================= */

  const fetchAllCoupons = async () => {
    const res = await getAllCoupons();
    res.success ? setAllCoupons(res.data) : setAllCoupons([]);
  };

  const handleApplyCoupon = async (code?: string) => {
    const couponCode = code || coupon;

    if (!couponCode) {
      toast.error("Please enter a coupon code");
      return;
    }

    const res = await applyCoupon({ code: couponCode });

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    setAppliedCoupon(res.data);
    setCoupon(res.data.coupon);
    setShowCouponsModal(false);
    toast.success(`Coupon ${res.data.coupon} applied`);
  };

  /* ================= CART ================= */

  const handleIncrease = async (productId: string) => {
    await addToCart(productId).unwrap();
    refetch();
  };

  const handleDecrease = async (productId: string, quantity: number) => {
    quantity === 1
      ? await removeFromCart(productId).unwrap()
      : await decreaseFromCart(productId).unwrap();
    refetch();
  };

  const handleRemove = async (productId: string) => {
    await removeFromCart(productId).unwrap();
    refetch();
  };

  useEffect(() => {
    fetchAllCoupons();
  }, []);

  /* ================= UI ================= */

  if (isLoading) return <div className="p-10 text-center">Loading cart...</div>;

  if (!items.length) {
    return (
      <div className="p-10 text-center">
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

  const handleCheckout = async()=>{
    // console.log("appleied coupon",appliedCoupon)
    const response = await checkout({couponCode:appliedCoupon?.coupon || ""})
    if(response.success){
      router.push(`/user/cart/checkout/${response.data.orderId}`)
    }
  }

  console.log("Publishable key",process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
      {(isFetching || isProcessing) && (
        <div className="absolute inset-0 bg-[var(--background)]/70 backdrop-blur-sm z-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* LEFT */}
      <div className="lg:col-span-2 space-y-6">
        <h1 className="text-2xl font-semibold">Shopping Cart</h1>

        {items.map((item: any) => {
          const p = item.product;
          const price = p.isOfferActive ? p.offerPrice : p.price;

          return (
            <div key={item.id} className="flex gap-4 border border-[var(--border)] bg-[var(--card)] rounded-xl p-4">
              <div className="relative w-24 h-24">
                <Image src={p.files[0]?.url} alt={p.title} fill className="object-cover rounded-md" />
              </div>

              <div className="flex-1">
                <h3 className="text-[var(--foreground)]">{p.title}</h3>
                <p className="text-sm text-[var(--foreground-muted)]">{p.description}</p>
                <p className="font-semibold text-primary">₹{price}</p>

                <div className="flex gap-3 mt-3">
                  <button onClick={() => handleDecrease(p.id, item.quantity)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleIncrease(p.id)}>+</button>
                  <button
                    onClick={() => handleRemove(p.id)}
                    className="text-red-600 ml-4"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="font-semibold">₹{price * item.quantity}</div>
            </div>
          );
        })}
      </div>

      {/* RIGHT */}
      <div className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Order Summary</h2>

        <span
          onClick={() => setShowCouponsModal(true)}
          className="text-blue-600 cursor-pointer"
        >
          Show All Coupons
        </span>

        <div className="flex gap-2">
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="Enter coupon"
            className="flex-1 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--foreground)] rounded-md px-3 py-2 outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={() => handleApplyCoupon()}
            className="bg-primary text-white font-semibold rounded-md px-4 hover:bg-primary-hover transition-colors"
          >
            Apply
          </button>
        </div>

        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{appliedCoupon?.subTotal ?? total}</span>
          </div>

          {appliedCoupon && (
            <>
              <div className="flex justify-between text-gray-500">
                <span>Coupon</span>
                <span>{appliedCoupon.coupon}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Discount</span>
                <span>-₹{appliedCoupon.discount}</span>
              </div>
            </>
          )}

          <div className="border-t border-[var(--border)] pt-2 flex justify-between font-semibold">
            <span className="text-[var(--foreground)]">Total</span>
            <span className="text-primary">₹{appliedCoupon?.total ?? total}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          className="w-full bg-primary text-white font-semibold py-3 rounded-md hover:bg-primary-hover transition-colors"
        >
          Proceed to Checkout
        </button>
      </div>

      {/* COUPON MODAL */}
      {showCouponsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-[var(--card)] w-full max-w-md p-6 rounded-2xl shadow-xl">
            <h2 className="font-bold mb-4 text-[var(--foreground)]">Available Coupons</h2>

            {allCoupons.map(c => (
              <div key={c.id} className="border border-[var(--border)] rounded-xl p-4 mb-3 hover:border-primary/50 transition-colors">
                <p className="font-bold text-primary">{c.code}</p>
                <p className="text-sm text-[var(--foreground)] mt-1">
                  {c.discountType === "FLAT"
                    ? `₹${c.discountValue} OFF`
                    : `${c.discountValue}% OFF (Max ₹${c.maxDiscount})`}
                </p>
                <p className="text-xs">Min Cart ₹{c.minCartValue}</p>

                <button
                  onClick={() => handleApplyCoupon(c.code)}
                  className="text-green-600 text-sm mt-2"
                >
                  Apply
                </button>
              </div>
            ))}

            <button
              onClick={() => setShowCouponsModal(false)}
              className="w-full mt-4 text-sm font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
