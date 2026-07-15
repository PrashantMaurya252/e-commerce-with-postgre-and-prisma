"use client"

import React from 'react'
import { useAppSelector } from '@/redux/hooks'
import { User, Mail, ShieldCheck } from 'lucide-react'

const Profile = () => {
  const { user } = useAppSelector((state) => state.auth)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-8 text-[var(--foreground)]">My Profile</h1>
      
      <div className="glass rounded-2xl p-8 border border-[var(--border)] relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary border-4 border-[var(--background)] shadow-lg">
            <User size={48} />
          </div>
          
          <div className="space-y-4 flex-1">
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">{user?.name || "User"}</h2>
              <div className="flex items-center gap-2 text-[var(--foreground-muted)] mt-1">
                <Mail size={16} />
                <span>{user?.email || "No email available"}</span>
              </div>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] rounded-full text-sm font-medium text-[var(--foreground)] border border-[var(--border)]">
              <ShieldCheck size={16} className="text-emerald-500" />
              Role: {user?.isAdmin ? "Admin" : "Customer"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile