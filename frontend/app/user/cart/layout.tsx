"use client";
import AuthGuard from "@/components/guards/AuthGuard";
import RoleGuard from "@/components/guards/RoleGuard";

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["USER"]}>{children}</RoleGuard>
    </AuthGuard>
  );
}
