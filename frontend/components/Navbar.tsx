'use client'

import { useAppSelector } from '@/redux/hooks'
import { RootState } from '@/redux/store'
import Link from 'next/link'
import { useGetCartItemsQuery } from '@/redux/services/cartApi'
import {
  Home,
  ShoppingBag,
  ClipboardList,
  ShoppingCart,
  User,
  LayoutDashboard,
  LogOut,
  Tag,
  Users,
  Sun,
  Moon,
  LogIn,
  Heart,
  Bell
} from 'lucide-react'
import { useTheme } from "next-themes"
import { logoutHandler, getNotificationsAPI, markNotificationAsReadAPI, markAllNotificationsAsReadAPI } from '@/utils/api'
import { toast } from 'sonner'
import { logout } from '@/redux/slices/authSlice'
import { useRouter, usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useState, useEffect } from 'react'

type Role = 'USER' | 'ADMIN'

interface NavbarProps {
  role?: Role
}

const Navbar = ({ role = 'USER' }: NavbarProps) => {
  const router = useRouter()
  const pathname = usePathname()
  
  const { user, isAuthenticated } = useAppSelector(
    (state: RootState) => state.auth
  )
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  const { data: cartData } = useGetCartItemsQuery(undefined, { 
    skip: !isAuthenticated || role !== 'USER' 
  });
  const cartItemsCount = cartData?.data?.items?.reduce((total: number, item: any) => total + item.quantity, 0) || 0;

  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  
  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
    }
  }, [isAuthenticated])
  
  const fetchNotifications = async () => {
    const res = await getNotificationsAPI()
    if (res.success) {
      setNotifications(res.data || [])
    }
  }
  
  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsReadAPI(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }
  
  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsReadAPI()
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const userOptions = [
    {
      id: 1,
      label: 'Home',
      route: '/user/home',
      icon: Home,
    },
    {
      id: 2,
      label: 'Products',
      route: '/user/products',
      icon: ShoppingBag,
    },
    ...(isAuthenticated ? [
      {
        id: 4,
        label: 'Cart',
        route: '/user/cart',
        icon: ShoppingCart,
      },
      {
        id: 5,
        label: 'Profile',
        route: '/user/profile',
        icon: User,
      },
      {
        id: 6,
        label: 'Wishlist',
        route: '/user/wishlist',
        icon: Heart,
      },
    ] : [])
  ]

  const adminOptions = [
    {
      id: 1,
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 2,
      label: 'Products',
      route: '/admin/products',
      icon: ShoppingBag,
    },
    {
      id: 3,
      label: 'Categories',
      route: '/admin/categories',
      icon: Tag,
    },
    {
      id: 4,
      label: 'Orders',
      route: '/admin/orders',
      icon: ClipboardList,
    },
    {
      id: 5,
      label: 'Users',
      route: '/admin/users',
      icon: Users,
    },
    {
      id: 6,
      label: 'Profile',
      route: '/admin/profile',
      icon: User,
    },
  ]

  const options = role === 'USER' ? userOptions : adminOptions

  const handleLogout = async()=>{
    try {
      logoutHandler()
      logout()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout Error",error)
      toast.error("Something went wrong while logout")
    }
  }

  return (
    <header
      className="
        fixed z-50 w-full
        bottom-0 lg:top-0 lg:bottom-auto
        glass
        shadow-sm lg:shadow-md
      "
    >
      <nav className="max-w-7xl mx-auto px-4">
        <div className="h-[76px] flex items-center justify-between">
          {/* Logo */}
          <Link href={role === 'USER' ? "/user/home" : "/admin/dashboard"} className="hidden lg:flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20">
              <ShoppingBag size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-gradient">
              DesiMarket
            </h1>
          </Link>

          {/* Menu */}
          <ul className="flex w-full lg:w-auto justify-around lg:justify-end gap-1 lg:gap-4">
            {options.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.route

              return (
                <li key={item.id}>
                  <Link
                    href={item.route}
                    className={clsx(
                      "flex flex-col lg:flex-row items-center gap-1 lg:gap-2",
                      "px-3 py-2 rounded-xl transition-all duration-300 font-medium text-xs lg:text-sm",
                      isActive 
                        ? "text-primary bg-primary/10 lg:shadow-sm" 
                        : "text-muted-foreground hover:text-primary hover:bg-muted"
                    )}
                  >
                    <div className="relative">
                      <Icon 
                        className={clsx(
                          "h-6 w-6 lg:h-5 lg:w-5 transition-transform duration-300",
                          isActive && "scale-110"
                        )} 
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      {item.label === 'Cart' && cartItemsCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold h-[18px] min-w-[18px] rounded-full flex items-center justify-center shadow-sm px-1">
                          {cartItemsCount > 99 ? '99+' : cartItemsCount}
                        </span>
                      )}
                    </div>

                    {/* Hide label on small screens */}
                    <span className="hidden sm:block lg:inline">
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-2)]">
                      <h3 className="font-bold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} className="text-[10px] text-primary font-medium hover:underline">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-[var(--foreground-muted)]">No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              if (!n.isRead) handleMarkAsRead(n.id)
                            }}
                            className={clsx(
                              "p-3 border-b border-[var(--border)] last:border-0 cursor-pointer transition-colors",
                              !n.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-[var(--surface-2)]"
                            )}
                          >
                            <h4 className="text-sm font-semibold text-[var(--foreground)]">{n.title}</h4>
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">{n.description}</p>
                            <span className="text-[10px] text-[var(--foreground-muted)] mt-2 block">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="p-2.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-violet-500" />}
            </button>
            {isAuthenticated ? (
              <button 
                className='flex items-center gap-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 font-semibold rounded-full px-5 py-2.5 transition-all duration-300 hover:shadow-sm active:scale-95' 
                onClick={handleLogout}
              >
                <LogOut size={18} strokeWidth={2.5} />
                <span>Logout</span>
              </button>
            ) : (
              <button 
                className='flex items-center gap-2 text-primary bg-primary/10 hover:bg-primary/20 font-semibold rounded-full px-5 py-2.5 transition-all duration-300 hover:shadow-sm active:scale-95' 
                onClick={() => router.push("/auth/login")}
              >
                <LogIn size={18} strokeWidth={2.5} />
                <span>Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
