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
  Ticket,
  HelpCircle,
  Bell,
  Megaphone,
  Sun,
  Moon,
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { logoutHandler } from "@/utils/api";
import { toast } from "sonner";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { useTheme } from "next-themes";

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
  {
    label: "Coupons",
    route: "/admin/coupons",
    icon: Ticket,
    description: "Discount Coupons",
  },
  {
    label: "FAQs",
    route: "/admin/faqs",
    icon: HelpCircle,
    description: "Manage FAQs",
  },
  {
    label: "Notifications",
    route: "/admin/notifications",
    icon: Bell,
    description: "Send Notifications",
  },
  {
    label: "Campaigns",
    route: "/admin/campaigns",
    icon: Megaphone,
    description: "Broadcast Campaigns",
  },
  {
    label: "Banners",
    route: "/admin/banners",
    icon: ImageIcon,
    description: "Manage Banners",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="p-5 border-b border-[var(--border)] flex-shrink-0 flex items-center justify-between">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-3 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform flex-shrink-0">
            <ShoppingBag size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-black text-[var(--foreground)] tracking-tight leading-none">
              DesiMarket
            </h1>
            <p className="text-xs text-[var(--foreground-muted)] font-medium mt-0.5">
              Admin Panel
            </p>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 -mr-2 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest px-3 mb-2 mt-1">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.route ||
            pathname.startsWith(item.route + "/");
          return (
            <Link
              key={item.route}
              href={item.route}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-all duration-150",
                isActive
                  ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400"
                  : "text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              )}
            >
              <div
                className={clsx(
                  "p-1.5 rounded-lg transition-colors flex-shrink-0",
                  isActive
                    ? "bg-emerald-500/20 text-emerald-500 dark:text-emerald-400"
                    : "bg-[var(--surface-3)] group-hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] group-hover:text-[var(--foreground)]"
                )}
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    "text-sm font-semibold leading-none truncate",
                    isActive
                      ? "text-emerald-500 dark:text-emerald-400"
                      : ""
                  )}
                >
                  {item.label}
                </p>
                <p className="text-[10px] text-[var(--foreground-muted)] mt-0.5 truncate">
                  {item.description}
                </p>
              </div>
              {isActive && (
                <ChevronRight
                  size={13}
                  className="text-emerald-500 dark:text-emerald-400 flex-shrink-0"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-[var(--border)] flex-shrink-0 space-y-1">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-all duration-150 group"
        >
          <div className="p-1.5 rounded-lg bg-[var(--surface-3)] group-hover:bg-[var(--surface-2)] transition-colors flex-shrink-0">
            {isDark ? (
              <Sun size={15} className="text-amber-400" />
            ) : (
              <Moon size={15} className="text-violet-500" />
            )}
          </div>
          <span className="text-sm font-semibold">
            {isDark ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all duration-150 group"
        >
          <div className="p-1.5 rounded-lg bg-[var(--surface-3)] group-hover:bg-rose-500/20 text-[var(--foreground-muted)] group-hover:text-rose-500 transition-colors flex-shrink-0">
            <LogOut size={15} />
          </div>
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[var(--surface)] border-r border-[var(--border)] fixed top-0 left-0 z-40 transition-colors duration-200">
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--surface)] border-b border-[var(--border)] px-4 h-14 flex items-center justify-between transition-colors duration-200">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/30">
            <ShoppingBag size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-black text-[var(--foreground)]">
            DesiMarket
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Mobile theme toggle */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="p-2 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-violet-500" />}
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
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
          "lg:hidden fixed top-0 left-0 h-full w-72 bg-[var(--surface)] border-r border-[var(--border)] z-50 transition-transform duration-300 shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
