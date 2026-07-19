"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAdminOrderById, updateOrderStatus, updatePaymentStatus } from "@/utils/adminApi";
import { Loader2, ArrowLeft, Package, MapPin, CreditCard, Box } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import Image from "next/image";

type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";

const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  PAID: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  SHIPPED: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  OUT_FOR_DELIVERY: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
  DELIVERED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  CANCELLED: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  SUCCEEDED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  FAILED: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  REFUNDED: "bg-slate-500/15 text-slate-500 border-slate-500/30",
};

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    const res = await getAdminOrderById(orderId);
    if (res.success) {
      setOrder(res.data);
    } else {
      toast.error(res.message || "Failed to fetch order");
    }
    setLoading(false);
  };

  const handleOrderStatusChange = async (newStatus: string) => {
    setUpdatingOrder(true);
    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      toast.success("Order status updated");
      setOrder((prev: any) => ({ ...prev, status: newStatus }));
    } else {
      toast.error(res.message || "Update failed");
    }
    setUpdatingOrder(false);
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    setUpdatingPayment(true);
    const res = await updatePaymentStatus(orderId, newStatus);
    if (res.success) {
      toast.success("Payment status updated");
      setOrder((prev: any) => ({
        ...prev,
        payment: { ...prev.payment, status: newStatus },
      }));
    } else {
      toast.error(res.message || "Update failed");
    }
    setUpdatingPayment(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-[var(--foreground-muted)] mb-4">Order not found</p>
        <button
          onClick={() => router.push("/admin/orders")}
          className="text-sm font-semibold text-[var(--foreground)] hover:underline"
        >
          Go back to orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[var(--border)] pb-6">
        <button
          onClick={() => router.push("/admin/orders")}
          className="p-2 hover:bg-[var(--surface-2)] rounded-xl transition-colors text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight font-mono">
            ORDER #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[var(--surface-2)]">
                  <Box size={18} className="text-[var(--foreground)]" />
                </div>
                <h2 className="font-bold text-[var(--foreground)] text-sm">Order Status</h2>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={order.status}
                  disabled={updatingOrder}
                  onChange={(e) => handleOrderStatusChange(e.target.value)}
                  className={clsx(
                    "w-full px-3 py-2 rounded-xl text-sm font-bold border focus:outline-none transition-colors cursor-pointer appearance-none",
                    STATUS_STYLES[order.status]
                  )}
                >
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-[var(--surface)] text-[var(--foreground)]">
                      {s}
                    </option>
                  ))}
                </select>
                {updatingOrder && <Loader2 size={18} className="animate-spin text-[var(--foreground-muted)]" />}
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-[var(--surface-2)]">
                  <CreditCard size={18} className="text-[var(--foreground)]" />
                </div>
                <h2 className="font-bold text-[var(--foreground)] text-sm">Payment Status</h2>
              </div>
              {order.payment ? (
                <div className="flex items-center gap-3">
                  <select
                    value={order.payment.status}
                    disabled={updatingPayment}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                    className={clsx(
                      "w-full px-3 py-2 rounded-xl text-sm font-bold border focus:outline-none transition-colors cursor-pointer appearance-none",
                      STATUS_STYLES[order.payment.status] || STATUS_STYLES["PENDING"]
                    )}
                  >
                    {PAYMENT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-[var(--surface)] text-[var(--foreground)]">
                        {s}
                      </option>
                    ))}
                  </select>
                  {updatingPayment && <Loader2 size={18} className="animate-spin text-[var(--foreground-muted)]" />}
                </div>
              ) : (
                <p className="text-sm font-medium text-[var(--foreground-muted)]">No payment record found.</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border)]">
              <h2 className="font-bold text-[var(--foreground)] text-sm flex items-center gap-2">
                <Package size={18} className="text-[var(--foreground-muted)]" />
                Order Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {order.items.map((item: any) => {
                 const itemPrice = item.price ?? (item.product.isOfferActive ? item.product.offerPrice : item.product.sellingPrice);
                 return (
                <div key={item.id} className="p-5 flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[var(--surface-2)] flex-shrink-0">
                    {item.product.files?.[0]?.url ? (
                      <Image
                        src={item.product.files[0].url}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--foreground-muted)] text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[var(--foreground)] truncate">
                      {item.product.title}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">
                      Qty: {item.quantity} × ₹{Number(itemPrice).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm text-emerald-500">
                      ₹{(item.quantity * Number(itemPrice)).toLocaleString()}
                    </p>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Summary */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
            <h2 className="font-bold text-[var(--foreground)] text-sm mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-[var(--foreground-muted)] uppercase font-bold tracking-wider mb-1">Name</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">{order.user?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--foreground-muted)] uppercase font-bold tracking-wider mb-1">Email</p>
                <p className="text-sm text-[var(--foreground)]">{order.user?.email || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
            <h2 className="font-bold text-[var(--foreground)] text-sm mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-[var(--foreground-muted)]" />
              Delivery Address
            </h2>
            {order.address ? (
              <div className="text-sm text-[var(--foreground)] space-y-1">
                <p className="font-medium">{order.address.line1}</p>
                {order.address.line2 && <p>{order.address.line2}</p>}
                <p>
                  {order.address.city}, {order.address.state}
                </p>
                <p className="font-medium mt-1">PIN: {order.address.pincode}</p>
                <p className="text-[var(--foreground-muted)] mt-2">
                  Phone: {order.address.phoneNumber1}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">No address provided.</p>
            )}
          </div>

          {/* Order Summary */}
          <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
            <h2 className="font-bold text-[var(--foreground)] text-sm mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-[var(--foreground-muted)]">
                <span>Subtotal</span>
                <span>₹{Number(order.subTotal).toLocaleString()}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-rose-500 font-medium">
                  <span>Discount</span>
                  <span>-₹{Number(order.discountAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 border-t border-[var(--border)] flex justify-between font-black text-[var(--foreground)]">
                <span>Total Amount</span>
                <span className="text-emerald-500">₹{Number(order.total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
