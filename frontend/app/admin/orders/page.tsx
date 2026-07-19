"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminOrders, updateOrderStatus } from "@/utils/adminApi";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { title: string; files?: { url: string }[] };
}

interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  id: string;
  status: OrderStatus;
  payment?: { status: string };
  total: number;
  createdAt: string;
  user: { name: string; email: string };
  items: OrderItem[];
  address: Address | null;
}

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  CONFIRMED: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  SHIPPED: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  DELIVERED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  CANCELLED: "bg-rose-500/15 text-rose-500 border-rose-500/30",
};

const FILTER_OPTIONS = ["ALL", ...STATUS_OPTIONS];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async (pg = page, filter = statusFilter) => {
    setLoading(true);
    const res = await getAdminOrders(
      pg,
      10,
      filter !== "ALL" ? filter : undefined
    );
    if (res.success) {
      setOrders(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalOrders(res.totalOrders || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders(page, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      toast.success("Order status updated");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus as OrderStatus } : o
        )
      );
    } else {
      toast.error(res.message || "Update failed");
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight">
            Orders
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            {totalOrders} orders total
          </p>
        </div>
        <button
          onClick={() => fetchOrders(page, statusFilter)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] rounded-xl font-semibold text-sm transition-all border border-[var(--border)] w-full sm:w-auto"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={clsx(
              "px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all",
              statusFilter === s
                ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/40"
                : "bg-[var(--surface-2)] text-[var(--foreground-muted)] border-[var(--border)] hover:border-[var(--border-2)] hover:text-[var(--foreground)]"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-24 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
            <ClipboardList size={44} className="text-[var(--foreground-muted)] opacity-30" />
            <p className="text-[var(--foreground-muted)] font-medium text-sm">No orders found</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden transition-all hover:border-[var(--border-2)] shadow-sm"
            >
              {/* Order Header Row */}
              <div
                className="flex flex-wrap items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 cursor-pointer hover:bg-[var(--surface-2)]"
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                {/* Order ID */}
                <div className="flex-1 min-w-[120px] sm:min-w-[140px]">
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase font-bold mb-0.5">
                    Order ID
                  </p>
                  <p className="text-sm font-bold text-[var(--foreground)] font-mono">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                {/* Customer */}
                <div className="flex-1 min-w-[120px] sm:min-w-[140px]">
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase font-bold mb-0.5">
                    Customer
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-[var(--foreground)] truncate max-w-[120px] sm:max-w-none">
                    {order.user.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] truncate max-w-[120px] sm:max-w-none">
                    {order.user.email}
                  </p>
                </div>

                {/* Amount */}
                <div className="flex-1 min-w-[80px] sm:min-w-[100px]">
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase font-bold mb-0.5">
                    Amount
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-emerald-500">
                    ₹{Number(order.total).toLocaleString()}
                  </p>
                </div>

                {/* Date */}
                <div className="hidden md:block flex-1 min-w-[100px]">
                  <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase font-bold mb-0.5">
                    Date
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--foreground)]">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Status selectors */}
                <div className="flex flex-col gap-2 sm:gap-3 items-end" onClick={(e) => e.stopPropagation()}>
                  {/* Order Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase">Order:</span>
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={clsx(
                        "px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border focus:outline-none transition-colors cursor-pointer appearance-none",
                        STATUS_STYLES[order.status] || STATUS_STYLES["PENDING"]
                      )}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s} className="bg-[var(--surface)] text-[var(--foreground)]">
                          {s}
                        </option>
                      ))}
                    </select>
                    {updatingId === order.id && (
                      <Loader2 size={14} className="animate-spin text-[var(--foreground-muted)]" />
                    )}
                  </div>
                  
                  {/* Payment Status Display */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase">Payment:</span>
                    <div className={clsx(
                      "px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border",
                      order.payment?.status === "SUCCEEDED" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" :
                      order.payment?.status === "FAILED" ? "bg-rose-500/15 text-rose-500 border-rose-500/30" :
                      order.payment?.status === "REFUNDED" ? "bg-slate-500/15 text-slate-500 border-slate-500/30" :
                      "bg-amber-500/15 text-amber-500 border-amber-500/30"
                    )}>
                      {order.payment?.status || "PENDING"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--foreground-muted)]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-2)] transition-all disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-2)] transition-all disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}