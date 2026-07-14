"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  ClipboardList,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { logoutHandler } from "@/utils/api";
import { toast } from "sonner";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";

const navItems = [
  {
    label: "Dashboard",
    route: "/admin/dashboard",
    icon: LayoutDashboard,
    description: "Overview & Stats",
  },
  {
    label: "Products",
    route: "/admin/products",
    icon: ShoppingBag,
    description: "Manage Products",
  },
  {
    label: "Categories",
    route: "/admin/categories",
    icon: Tag,
    description: "Manage Categories",
  },
  {
    label: "Orders",
    route: "/admin/orders",
    icon: ClipboardList,
    description: "View & Update Orders",
  },
  {
    label: "Users",
    route: "/admin/users",
    icon: Users,
    description: "Manage Users",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutHandler();
      dispatch(logout());
      router.push("/auth/login");
    } catch {
      toast.error("Something went wrong while logging out");
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
            <ShoppingBag size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none">
              DesiMarket
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Admin Panel
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.route;
          return (
            <Link
              key={item.route}
              href={item.route}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-3.5 px-3 py-3 rounded-xl group transition-all duration-200",
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <div
                className={clsx(
                  "p-1.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 group-hover:bg-slate-700 text-slate-500 group-hover:text-white"
                )}
              >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    "text-sm font-semibold leading-none",
                    isActive ? "text-emerald-400" : ""
                  )}
                >
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {item.description}
                </p>
              </div>
              {isActive && (
                <ChevronRight
                  size={14}
                  className="text-emerald-400 flex-shrink-0"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all duration-200 group"
        >
          <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-rose-500/20 text-slate-500 group-hover:text-rose-400 transition-colors">
            <LogOut size={17} />
          </div>
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-800 fixed top-0 left-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-4 h-16 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-500/30">
            <ShoppingBag size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-base font-black text-white">DesiMarket</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={clsx(
          "lg:hidden fixed top-0 left-0 h-full w-72 bg-slate-900 z-50 transition-transform duration-300 shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarContent />
      </aside>
    </>
  );
}
