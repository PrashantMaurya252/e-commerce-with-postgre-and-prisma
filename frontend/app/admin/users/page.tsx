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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Users
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalUsers} registered users
          </p>
        </div>
        <button
          onClick={() => fetchUsers(page)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition-all border border-slate-700 hover:border-slate-600 self-start sm:self-auto"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm text-slate-200 placeholder-slate-500 transition-colors"
        />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total",
            value: totalUsers,
            color: "text-slate-300",
            bg: "bg-slate-800/60",
          },
          {
            label: "Active",
            value: users.filter((u) => u.isActive).length,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Inactive",
            value: users.filter((u) => !u.isActive).length,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl px-4 py-3 border border-slate-800 ${s.bg}`}
          >
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Table / List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Users size={48} className="text-slate-700" />
            <p className="text-slate-500 font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    Joined
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                    Orders
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
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
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-200">
                              {user.name}
                            </p>
                            {user.isAdmin && (
                              <span className="px-1.5 py-0.5 rounded-md bg-violet-500/15 text-violet-400 text-[10px] font-bold">
                                ADMIN
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Mail size={13} className="text-slate-600" />
                        <span className="text-slate-400 text-sm">
                          {user.email}
                        </span>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-600" />
                        <span className="text-slate-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Orders */}
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={13} className="text-slate-600" />
                        <span className="text-slate-300 font-semibold text-sm">
                          {user._count.orders}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      <span
                        className={clsx(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                          user.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        )}
                      >
                        <span
                          className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            user.isActive ? "bg-emerald-400" : "bg-rose-400"
                          )}
                        />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4 text-right">
                      {!user.isAdmin && (
                        <button
                          onClick={() => handleToggle(user)}
                          disabled={togglingId === user.id}
                          className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ml-auto",
                            user.isActive
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          )}
                        >
                          {togglingId === user.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : user.isActive ? (
                            <ShieldOff size={13} />
                          ) : (
                            <ShieldCheck size={13} />
                          )}
                          {user.isActive ? "Deactivate" : "Activate"}
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
