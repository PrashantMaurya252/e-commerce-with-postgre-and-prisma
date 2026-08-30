"use client"

import React, { useEffect, useState } from 'react'
import { getSessionsAPI, logoutFromParticularDeviceAPI, logoutFromAllDevicesAPI } from '@/utils/api'
import { Monitor, Smartphone, Globe, AlertCircle, LogOut, Loader2, ShieldCheck, Laptop } from 'lucide-react'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { logout } from '@/redux/slices/authSlice'
import { useRouter } from 'next/navigation'

interface Session {
  id: string
  deviceName: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  lastUsedAt: string
  expiresAt: string
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const dispatch = useDispatch()
  const router = useRouter()

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await getSessionsAPI()
      if (res.success) {
        setSessions(res.data.sessions)
      } else {
        toast.error(res.message || "Failed to fetch sessions")
      }
    } catch (error) {
      toast.error("Something went wrong while fetching sessions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleLogoutDevice = async (sessionId: string) => {
    try {
      setActionLoading(sessionId)
      const res = await logoutFromParticularDeviceAPI(sessionId)
      if (res.success) {
        toast.success(res.message || "Logged out from device successfully")
        setSessions(prev => prev.filter(s => s.id !== sessionId))
      } else {
        toast.error(res.message || "Failed to logout from device")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogoutAll = async () => {
    try {
      setActionLoading('all')
      const res = await logoutFromAllDevicesAPI()
      if (res.success) {
        toast.success(res.message || "Logged out from all devices")
        dispatch(logout())
        router.push("/auth/login")
      } else {
        toast.error(res.message || "Failed to logout from all devices")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setActionLoading(null)
    }
  }

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe className="text-[var(--foreground-muted)]" size={24} />
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return <Smartphone className="text-blue-500" size={24} />
    if (ua.includes('macintosh') || ua.includes('windows')) return <Laptop className="text-purple-500" size={24} />
    return <Monitor className="text-[var(--foreground-muted)]" size={24} />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <ShieldCheck className="text-green-500" size={28} />
            Active Sessions
          </h2>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            Manage and log out your active sessions on other browsers and devices.
          </p>
        </div>
        <button
          onClick={handleLogoutAll}
          disabled={actionLoading === 'all'}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors font-medium disabled:opacity-50"
        >
          {actionLoading === 'all' ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
          Logout All Devices
        </button>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Device Limit Information</h4>
          <p className="text-sm text-blue-700 dark:text-blue-400/80 mt-1">
            You can be logged into a maximum of <strong>5 devices</strong> simultaneously. If you exceed this limit, you will need to log out of an existing session.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-[var(--foreground-muted)]">
            No active sessions found.
          </div>
        ) : (
          sessions.map((session, index) => (
            <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-[var(--border)] rounded-xl hover:bg-[var(--surface-2)] transition-colors gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[var(--surface-3)] rounded-full shrink-0 border border-[var(--border)] shadow-sm">
                  {getDeviceIcon(session.userAgent)}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)] text-base">
                    {session.deviceName || session.userAgent?.split(' ')[0] || "Unknown Device"}
                    {index === 0 && (
                      <span className="ml-2 text-xs font-medium px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                        Current
                      </span>
                    )}
                  </h3>
                  <div className="text-sm text-[var(--foreground-muted)] mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span>IP: {session.ipAddress || "Unknown"}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Last active: {formatDate(session.lastUsedAt)}</span>
                  </div>
                </div>
              </div>
              
              {index !== 0 && (
                <button
                  onClick={() => handleLogoutDevice(session.id)}
                  disabled={actionLoading === session.id}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30 disabled:opacity-50"
                >
                  {actionLoading === session.id ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                  Logout
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
