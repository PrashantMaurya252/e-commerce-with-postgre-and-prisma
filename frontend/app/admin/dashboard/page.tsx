"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/utils/adminApi";
import {
  ShoppingBag,
  ClipboardList,
  Tag,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface DashboardData {
  totalOrders: number;
  totalProducts: number;
  categories: { id: string; name: string; _count: { products: number } }[];
  monthlyOrders: { month: string; count: number }[];
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    const res = await getDashboardStats();
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.message || "Failed to load stats");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const maxCount =
    data?.monthlyOrders?.length
      ? Math.max(...data.monthlyOrders.map((m: any) => m.count), 1)
      : 1;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-[var(--surface-2)]" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-[var(--surface-2)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle size={48} className="text-rose-500" />
        <p className="text-[var(--foreground)] font-medium">{error}</p>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Orders",
      value: data?.totalOrders ?? 0,
      icon: ClipboardList,
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
    },
    {
      label: "Total Products",
      value: data?.totalProducts ?? 0,
      icon: ShoppingBag,
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-500/10",
      text: "text-violet-500",
    },
    {
      label: "Categories",
      value: data?.categories?.length ?? 0,
      icon: Tag,
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-500/10",
      text: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight">
            Dashboard
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            Welcome back! Here&apos;s what&apos;s happening in your store.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] rounded-xl font-semibold text-sm transition-all border border-[var(--border)] w-full sm:w-auto"
        >
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 sm:p-6 overflow-hidden group hover:border-[var(--border-2)] transition-all duration-300 shadow-sm"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-[0.08] dark:opacity-10 bg-gradient-to-br ${card.color} -translate-y-1/2 translate-x-1/2`}
              />
              <div className="relative">
                <div className={`inline-flex p-3 rounded-xl ${card.bg} mb-3 sm:mb-4`}>
                  <Icon size={22} className={card.text} strokeWidth={2} />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-[var(--foreground)]">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-[var(--foreground-muted)] text-xs sm:text-sm font-medium mt-1">
                  {card.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Orders Bar Chart */}
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--foreground)]">Monthly Orders</h2>
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase tracking-wider font-bold">Orders volume over time</p>
          </div>
        </div>

        {data?.monthlyOrders && data.monthlyOrders.length > 0 ? (
          <div className="flex items-end gap-1 sm:gap-2 h-40 sm:h-48 overflow-x-auto pb-2">
            {(data.monthlyOrders as any[]).map((item, idx) => {
              const monthDate = new Date(item.month);
              const monthLabel = MONTH_NAMES[monthDate.getMonth()];
              const heightPct = Math.max((item.count / maxCount) * 100, 4);
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-2 flex-1 min-w-[32px] sm:min-w-[40px] group"
                >
                  <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 hover:from-emerald-500 hover:to-emerald-300 cursor-pointer relative group"
                    style={{ height: `${heightPct}%` }}
                    title={`${monthLabel}: ${item.count} orders`}
                  />
                  <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)] font-medium">
                    {monthLabel}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 sm:h-48 text-[var(--foreground-muted)] text-sm">
            No order data available yet.
          </div>
        )}
      </div>

      {/* Categories Table */}
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Tag size={16} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[var(--foreground)]">
              Categories Overview
            </h2>
            <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] uppercase tracking-wider font-bold">Products per category</p>
          </div>
        </div>

        {data?.categories && data.categories.length > 0 ? (
          <div className="space-y-4">
            {data.categories.map((cat) => {
              const maxProducts = Math.max(
                ...data.categories.map((c) => c._count.products),
                1
              );
              const pct = (cat._count.products / maxProducts) * 100;
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-medium text-[var(--foreground)]">
                      {cat.name}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-amber-500">
                      {cat._count.products} products
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[var(--foreground-muted)] text-sm text-center py-6">
            No categories found.
          </p>
        )}
      </div>
    </div>
  );
}