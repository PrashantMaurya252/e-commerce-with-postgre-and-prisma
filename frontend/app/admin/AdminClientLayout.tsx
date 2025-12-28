"use client"

import AuthGuard from "@/components/guards/AuthGuard"
import RoleGuard from "@/components/guards/RoleGuard"
import Navbar from "@/components/Navbar"

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={["ADMIN"]}>
        <Navbar role="ADMIN"/>
        <main className="pt-[72px] pb-[72px]">{children}</main>
      </RoleGuard>
    </AuthGuard>
  )
}
