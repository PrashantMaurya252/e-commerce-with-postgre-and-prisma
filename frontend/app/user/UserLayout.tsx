"use client"

import AuthGuard from "@/components/guards/AuthGuard"
import RoleGuard from "@/components/guards/RoleGuard"
import Navbar from "@/components/Navbar"
import ChatBot from "@/components/ChatBot"

export default function UserClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar role="USER"/>
      <main className="pt-[72px] pb-[72px]">{children}</main>
      <ChatBot />
    </>
  )
}
