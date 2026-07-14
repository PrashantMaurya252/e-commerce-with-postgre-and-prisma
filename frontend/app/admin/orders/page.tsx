"use client";

import { useEffect, useState } from "react";
import { getAdminOrders, updateOrderStatus } from "@/utils/adminApi";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  ChevronDown,
  MapPin,
  Package,
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
  product: { name: string; files?: { url: string }[] };
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
  totalAmount: number;
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
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  CONFIRMED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  SHIPPED: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  DELIVERED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  CANCELLED: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const FILTER_OPTIONS = ["ALL", ...STATUS_OPTIONS];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Orders
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalOrders} orders total
          </p>
        </div>
        <button
          onClick={() => fetchOrders(page, statusFilter)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition-all border border-slate-700 hover:border-slate-600 self-start sm:self-auto"
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
              "px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
              statusFilter === s
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                : "bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-24 rounded-2xl border border-slate-800 bg-slate-900">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl border border-slate-800 bg-slate-900">
            <ClipboardList size={48} className="text-slate-700" />
            <p className="text-slate-500 font-medium">No orders found</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden transition-all hover:border-slate-700"
            >
              {/* Order Header Row */}
              <div
                className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer"
                onClick={() =>
                  setExpandedId(
                    expandedId === order.id ? null : order.id
                  )
                }
              >
                {/* Order ID */}
                <div className="flex-1 min-w-[140px]">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Order ID
                  </p>
                  <p className="text-sm font-bold text-white font-mono">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                {/* Customer */}
                <div className="flex-1 min-w-[140px]">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Customer
                  </p>
                  <p className="text-sm font-semibold text-slate-200">
                    {order.user.name}
                  </p>
                  <p className="text-xs text-slate-500">{order.user.email}</p>
                </div>

                {/* Amount */}
                <div className="flex-1 min-w-[100px]">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Amount
                  </p>
                  <p className="text-sm font-bold text-emerald-400">
                    ₹{Number(order.totalAmount).toLocaleString()}
                  </p>
                </div>

                {/* Date */}
                <div className="hidden md:block flex-1 min-w-[100px]">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Date
                  </p>
                  <p className="text-sm text-slate-300">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Status selector */}
                <div
                  className="flex items-center gap-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                    className={clsx(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border bg-transparent focus:outline-none transition-colors cursor-pointer appearance-none pr-7",
                      STATUS_STYLES[order.status]
                    )}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-slate-900 text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                  {updatingId === order.id && (
                    <Loader2 size={14} className="animate-spin text-slate-400" />
                  )}
                </div>

                {/* Expand icon */}
                <ChevronDown
                  size={18}
                  className={clsx(
                    "text-slate-500 transition-transform duration-200 flex-shrink-0",
                    expandedId === order.id && "rotate-180"
                  )}
                />
              </div>

              {/* Expanded Details */}
              {expandedId === order.id && (
                <div className="border-t border-slate-800 px-5 py-4 space-y-4">
                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Items ({order.items.length})
                    </p>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-800/60"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-slate-700">
                              <Package size={14} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-200">
                              {item.product.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-400">
                              x{item.quantity}
                            </span>
                            <span className="font-bold text-emerald-400">
                              ₹{Number(item.price).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address */}
                  {order.address && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Delivery Address
                      </p>
                      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-slate-800/60">
                        <MapPin
                          size={14}
                          className="text-slate-500 mt-0.5 flex-shrink-0"
                        />
                        <p className="text-sm text-slate-300">
                          {order.address.street}, {order.address.city},{" "}
                          {order.address.state} – {order.address.pincode}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}