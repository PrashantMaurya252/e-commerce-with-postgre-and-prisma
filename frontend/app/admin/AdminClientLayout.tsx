"use client";

import AuthGuard from "@/components/guards/AuthGuard";
import RoleGuard from "@/components/guards/RoleGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTheme } = useTheme();

  // Admin panel always starts in dark mode but respects user's toggle choice
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (!stored) setTheme("dark");
  }, [setTheme]);

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="flex min-h-screen bg-[var(--background)]">
          <AdminSidebar />
          {/* Main content area — offset for sidebar on desktop, offset for mobile top bar */}
          <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen transition-colors duration-200">
            <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">{children}</div>
          </main>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
