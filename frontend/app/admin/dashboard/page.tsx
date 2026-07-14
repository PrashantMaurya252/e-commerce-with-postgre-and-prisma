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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-800" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-slate-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle size={48} className="text-rose-400" />
        <p className="text-slate-300 font-medium">{error}</p>
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
      text: "text-emerald-400",
    },
    {
      label: "Total Products",
      value: data?.totalProducts ?? 0,
      icon: ShoppingBag,
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-500/10",
      text: "text-violet-400",
    },
    {
      label: "Categories",
      value: data?.categories?.length ?? 0,
      icon: Tag,
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back! Here&apos;s what&apos;s happening in your store.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition-all border border-slate-700 hover:border-slate-600"
        >
          <RefreshCw size={15} />
          <span className="hidden sm:block">Refresh</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative rounded-2xl border border-slate-800 bg-slate-900 p-6 overflow-hidden group hover:border-slate-700 transition-all duration-300"
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-gradient-to-br ${card.color} -translate-y-1/2 translate-x-1/2`}
              />
              <div className="relative">
                <div
                  className={`inline-flex p-3 rounded-xl ${card.bg} mb-4`}
                >
                  <Icon size={22} className={card.text} strokeWidth={2} />
                </div>
                <p className="text-3xl font-black text-white">
                  {card.value.toLocaleString()}
                </p>
                <p className="text-slate-400 text-sm font-medium mt-1">
                  {card.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Orders Bar Chart */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Monthly Orders</h2>
            <p className="text-xs text-slate-500">Orders volume over time</p>
          </div>
        </div>

        {data?.monthlyOrders && data.monthlyOrders.length > 0 ? (
          <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
            {(data.monthlyOrders as any[]).map((item, idx) => {
              const monthDate = new Date(item.month);
              const monthLabel = MONTH_NAMES[monthDate.getMonth()];
              const heightPct = Math.max((item.count / maxCount) * 100, 4);
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-2 flex-1 min-w-[40px] group"
                >
                  <span className="text-xs text-slate-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 hover:from-emerald-500 hover:to-emerald-300 cursor-pointer relative group"
                    style={{ height: `${heightPct}%` }}
                    title={`${monthLabel}: ${item.count} orders`}
                  />
                  <span className="text-xs text-slate-500 font-medium">
                    {monthLabel}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
            No order data available yet.
          </div>
        )}
      </div>

      {/* Categories Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Tag size={18} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Categories Overview
            </h2>
            <p className="text-xs text-slate-500">Products per category</p>
          </div>
        </div>

        {data?.categories && data.categories.length > 0 ? (
          <div className="space-y-3">
            {data.categories.map((cat) => {
              const maxProducts = Math.max(
                ...data.categories.map((c) => c._count.products),
                1
              );
              const pct = (cat._count.products / maxProducts) * 100;
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-300">
                      {cat.name}
                    </span>
                    <span className="text-xs font-bold text-amber-400">
                      {cat._count.products} products
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
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
          <p className="text-slate-500 text-sm text-center py-6">
            No categories found.
          </p>
        )}
      </div>
    </div>
  );
}