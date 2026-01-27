"use client"

import { useAppSelector } from "@/redux/hooks"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function RootRedirect() {
  const { isAuthenticated, user, authInitialized } = useAppSelector(
    (state) => state.auth
  )
  const router = useRouter()

  useEffect(() => {
    if (!authInitialized) return

    if (!isAuthenticated) {
      router.replace("/auth/login")
      return
    }

    if (user?.isAdmin) {
      router.replace("/admin/home")
    } else {
      router.replace("/user/home")
    }
  }, [isAuthenticated, user, authInitialized, router])

  return null
}
