"use client"

import React, { useState } from 'react'
import { useAppSelector } from '@/redux/hooks'
import { User, MapPin, Package, LogOut } from 'lucide-react'
import ProfileInfo from '@/components/profile/ProfileInfo'
import ManageAddresses from '@/components/profile/ManageAddresses'
import OrderHistory from '@/components/profile/OrderHistory'
import { useGetProfileQuery, useGetUserOrdersQuery } from '@/redux/services/profileApi'
import { logoutHandler } from '@/utils/api'
import { logout } from '@/redux/slices/authSlice'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'

export default function Profile() {
  const { user } = useAppSelector((state) => state.auth)
  const router = useRouter()
  const dispatch = useDispatch()
  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'orders'>('info')

  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery(user?.id || '', {
    skip: !user?.id
  })
  const { data: ordersData, isLoading: ordersLoading } = useGetUserOrdersQuery()

  const handleLogout = async () => {
    try {
      logoutHandler()
      dispatch(logout())
      router.push("/auth/login")
    } catch (error) {
      toast.error("Something went wrong while logout")
    }
  }

  const tabs = [
    { id: 'info', label: 'Profile Info', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'orders', label: 'My Orders', icon: Package },
  ]

  if (profileLoading || ordersLoading) {
    return <div className="max-w-5xl mx-auto px-4 py-12 flex justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
  }

  const fullProfile = profileData?.data || user
  const addresses = profileData?.data?.addresses || []
  const userOrders = ordersData?.data || []
  // User reviews from orders (or we can just fetch all user reviews, but for now order's product existing reviews)
  // We can just rely on the API to update review, or extract existing review if available.
  // Wait, does the order response include reviews? Let's check `order.controller.ts` includes later if needed.
  // Actually, we can fetch reviews separately or rely on what's returned. Let's pass empty array for now or extract from profile.
  const userReviews = profileData?.data?.reviews || []

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-[75vh]">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR TABS */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 sticky top-24 shadow-sm">
            <h1 className="text-2xl font-black mb-6 px-2 text-[var(--foreground)]">My Account</h1>
            <nav className="flex flex-col gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left ${
                      isActive 
                        ? "bg-primary text-white shadow-md shadow-primary/20" 
                        : "text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                )
              })}
              <hr className="my-2 border-[var(--border)]" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-w-0">
          {activeTab === 'info' && <ProfileInfo user={fullProfile} />}
          {activeTab === 'addresses' && <ManageAddresses addresses={addresses} />}
          {activeTab === 'orders' && <OrderHistory orders={userOrders} userReviews={userReviews} />}
        </div>
      </div>
    </div>
  )
}