"use client";

import AuthGuard from "@/components/guards/AuthGuard";
import RoleGuard from "@/components/guards/RoleGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <div className="flex min-h-screen bg-slate-950">
          <AdminSidebar />
          {/* Main content area — offset for sidebar on desktop, offset for mobile top bar */}
          <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
