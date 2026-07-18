"use client";

import { useEffect, useState } from "react";
import {
  getAdminUsers,
  toggleUserStatus,
} from "@/utils/adminApi";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Mail,
  Calendar,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = async (pg = page) => {
    setLoading(true);
    const res = await getAdminUsers(pg, 10);
    if (res.success) {
      setUsers(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalUsers(res.totalUsers || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleToggle = async (user: User) => {
    setTogglingId(user.id);
    const res = await toggleUserStatus(user.id, !user.isActive);
    if (res.success) {
      toast.success(
        !user.isActive ? "User activated" : "User deactivated"
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        )
      );
    } else {
      toast.error(res.message || "Failed to update status");
    }
    setTogglingId(null);
  };

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight">
            Users
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            {totalUsers} registered users
          </p>
        </div>
        <button
          onClick={() => fetchUsers(page)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] rounded-xl font-semibold text-sm transition-all border border-[var(--border)] w-full sm:w-auto"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-11 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] transition-colors"
        />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: "Total",
            value: totalUsers,
            color: "text-[var(--foreground)]",
            bg: "bg-[var(--surface-2)]",
          },
          {
            label: "Active",
            value: users.filter((u) => u.isActive).length,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Inactive",
            value: users.filter((u) => !u.isActive).length,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl px-3 sm:px-4 py-3 border border-[var(--border)] ${s.bg}`}
          >
            <p className={`text-lg sm:text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--foreground-muted)] font-medium mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Table / List */}
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users size={44} className="text-[var(--foreground-muted)] opacity-30" />
            <p className="text-[var(--foreground-muted)] font-medium text-sm">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["User", "Email", "Joined", "Orders", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className={clsx(
                        "text-left px-4 py-3.5 text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest",
                        h === "Email" && "hidden md:table-cell",
                        h === "Joined" && "hidden lg:table-cell",
                        h === "Orders" && "hidden sm:table-cell",
                        h === "" && "text-right"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[var(--surface-2)] transition-colors group"
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                          {user.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.name}
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[var(--foreground)] truncate max-w-[150px]">
                              {user.name}
                            </p>
                            {user.isAdmin && (
                              <span className="px-1.5 py-0.5 rounded-md bg-violet-500/15 text-violet-500 text-[10px] font-bold flex-shrink-0">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--foreground-muted)] md:hidden truncate max-w-[150px]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-[var(--foreground-muted)] flex-shrink-0" />
                        <span className="text-[var(--foreground-muted)] text-sm font-medium truncate max-w-[180px]">
                          {user.email}
                        </span>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-[var(--foreground-muted)] flex-shrink-0" />
                        <span className="text-[var(--foreground-muted)] text-sm font-medium">
                          {new Date(user.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={12} className="text-[var(--foreground-muted)] flex-shrink-0" />
                        <span className="text-[var(--foreground)] font-bold text-sm">
                          {user._count.orders}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border",
                          user.isActive
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}
                      >
                        <span
                          className={clsx(
                            "w-1.5 h-1.5 rounded-full flex-shrink-0",
                            user.isActive ? "bg-emerald-500" : "bg-rose-500"
                          )}
                        />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      {!user.isAdmin && (
                        <button
                          onClick={() => handleToggle(user)}
                          disabled={togglingId === user.id}
                          className={clsx(
                            "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ml-auto",
                            user.isActive
                              ? "bg-[var(--surface-2)] text-[var(--foreground-muted)] border-[var(--border)] hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30"
                              : "bg-[var(--surface-2)] text-[var(--foreground-muted)] border-[var(--border)] hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30"
                          )}
                        >
                          {togglingId === user.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : user.isActive ? (
                            <ShieldOff size={13} />
                          ) : (
                            <ShieldCheck size={13} />
                          )}
                          <span className="hidden sm:inline">
                            {user.isActive ? "Deactivate" : "Activate"}
                          </span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-2)] transition-all disabled:opacity-30"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
